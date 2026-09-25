// ============================================================================
// Edge Function: verify-anchor (read-only, no signing key involved)
// Fetches the on-chain anchor for a document version so the frontend can run
// the three-way integrity check: file bytes vs DB hash vs on-chain hash.
// (Reads could also be done client-side against the RPC; this keeps the
// contract address + RPC in one place and works even if the RPC rate-limits.)
//
// Deploy: supabase functions deploy verify-anchor
// Secrets: AMOY_RPC_URL, DOCUMENT_ANCHOR_ADDRESS
// Body: { document_version_id: uuid }
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { JsonRpcProvider, Contract } from 'npm:ethers@6';

const ABI = [
  'function verify(bytes32 docCode, uint256 version) view returns (bytes32,uint64,address,bool)',
];

function bytes32FromHexSha256(hex: string): string {
  const clean = hex.replace(/^0x/i, '').toLowerCase();
  return '0x' + (clean.length === 64 ? clean : ''.padEnd(64, '0'));
}

function docCodeFromId(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: ver, error } = await supabase
      .from('document_versions')
      .select('id, version_number, file_hash, chain_hash, on_chain_tx_hash, on_chain_status')
      .eq('id', document_version_id).single();
    if (error || !ver) return json({ error: 'version not found' }, 404);

    const addr = Deno.env.get('DOCUMENT_ANCHOR_ADDRESS');
    if (!addr) return json({ on_chain: false, reason: 'anchoring not configured' });

    const provider = new JsonRpcProvider(Deno.env.get('AMOY_RPC_URL') ?? 'https://rpc-amoy.polygon.tech');
    const contract = new Contract(addr, ABI, provider);
    const [fileHash, anchoredAt, anchoredBy, exists] = await contract.verify(
      docCodeFromId(ver.id), ver.version_number,
    );

    const onChainHex = exists ? fileHash.slice(2) : null;
    return json({
      on_chain: exists,
      anchored_at: exists ? Number(anchoredAt) : null,
      anchored_by: exists ? anchoredBy : null,
      on_chain_file_hash: onChainHex,
      db_file_hash: ver.file_hash,
      matches_db: exists ? onChainHex === ver.file_hash.replace(/^0x/i, '').toLowerCase() : false,
      tx_hash: ver.on_chain_tx_hash,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
