// ============================================================================
// Edge Function: anchor-document
// Computes SHA-256 of the stored file SERVER-SIDE, builds the chain hash, and
// anchors it on Polygon Amoy via DocumentAnchor. The wallet key lives in
// Supabase Edge secrets — never in the client.
//
// Deploy:
//   supabase functions deploy anchor-document
//   supabase secrets set ANCHOR_WALLET_PRIVATE_KEY=0x... AMOY_RPC_URL=https://rpc-amoy.polygon.tech \
//     DOCUMENT_ANCHOR_ADDRESS=0x...
//
// Body: { document_version_id: uuid }
// Auth: verified user JWT; RLS governs the DB rows it touches.
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Wallet, JsonRpcProvider, Contract, toBeHex } from 'npm:ethers@6';

const ABI = [
  'function anchorVersion(bytes32 docCode, uint256 version, bytes32 fileHash) external',
  'function verify(bytes32 docCode, uint256 version) view returns (bytes32,uint64,address,bool)',
];

function bytes32FromHexSha256(hex: string): string {
  const clean = hex.replace(/^0x/i, '').toLowerCase();
  if (clean.length !== 64) throw new Error('file_hash is not a 32-byte hex string');
  return '0x' + clean;
}

// docCode: opaque bytes32 from the version id (no PII by construction)
function docCodeFromId(id: string): string {
  let h = 0x811c9dc5; // FNV-1a — stable, collision-safe enough for demo scale;
  for (let i = 0; i < id.length; i++) {                     // swap for keccak(uuid) in prod
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return '0x' + h.toString(16).padStart(8, '0') + id.replace(/-/g, '').slice(0, 56).padEnd(56, '0');
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const { document_version_id } = await req.json();
    if (!document_version_id) return json({ error: 'document_version_id required' }, 400);

    // 1. Verify caller identity
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await admin.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    // 2. Load the version row
    const { data: ver, error } = await admin
      .from('document_versions').select('*').eq('id', document_version_id).single();
    if (error || !ver) return json({ error: 'version not found' }, 404);
    if (ver.on_chain_status === 'anchored') {
      return json({ ok: true, already: true, tx: ver.on_chain_tx_hash });
    }

    // 3. Mark pending
    await admin.from('document_versions')
      .update({ on_chain_status: 'pending' }).eq('id', document_version_id);

    // 4. Read the actual stored file and hash it HERE (client value can't be trusted)
    const { data: blob, error: dlErr } = await admin.storage
      .from('documents').download(ver.storage_path);
    if (dlErr || !blob) {
      await admin.from('document_versions')
        .update({ on_chain_status: 'failed' }).eq('id', document_version_id);
      return json({ error: 'storage download failed: ' + (dlErr?.message ?? '') }, 500);
    }
    const fileHash = toHexSha256(await blob.arrayBuffer());
    await admin.from('document_versions')
      .update({ file_hash: fileHash }).eq('id', document_version_id);

    // 5. Chain hash = SHA-256(fileHash | previousHash) — version-tamper-evident
    const chainHash = toHexSha256(
      new TextEncoder().encode(fileHash + (ver.previous_hash ?? '')),
    );

    // 6. Anchor on Amoy
    const pk = Deno.env.get('ANCHOR_WALLET_PRIVATE_KEY');
    const rpc = Deno.env.get('AMOY_RPC_URL') ?? 'https://rpc-amoy.polygon.tech';
    const addr = Deno.env.get('DOCUMENT_ANCHOR_ADDRESS');
    if (!pk || !addr) {
      // Anchoring infra not configured yet: keep the hash chain, report clearly
      return json({ ok: false, anchored: false, reason: 'anchoring not configured', fileHash, chainHash }, 200);
    }
    const provider = new JsonRpcProvider(rpc);
    const wallet = new Wallet(pk, provider);
    const contract = new Contract(addr, ABI, wallet);

    const tx = await contract.anchorVersion(
      docCodeFromId(document_version_id),
      ver.version_number,
      bytes32FromHexSha256(fileHash),
    );
    const receipt = await tx.wait();

    // 7. Write back — Realtime pushes this to open Integrity pages
    await admin.from('document_versions')
      .update({
        on_chain_tx_hash: receipt.hash,
        on_chain_status: 'anchored',
        on_chain_timestamp: new Date().toISOString(),
        chain_hash: chainHash,
      }).eq('id', document_version_id);

    return json({ ok: true, anchored: true, tx: receipt.hash, fileHash, chainHash });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

async function toHexSha256(buf: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
