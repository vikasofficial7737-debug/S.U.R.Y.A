/* ============================================================================
   Client anchor service — talks to the Edge Functions when live, falls back to
   the local hash-chain ledger when Supabase/anchoring isn't configured, so the
   demo and the classroom presentation never break.

   Three-way integrity check (spec §4):
     1. recompute SHA-256 of the stored file (client fetch)
     2. compare with document_versions.file_hash (DB)
     3. compare with the on-chain hash (verify-anchor Edge Function / contract)
   Mismatch between recomputed and on-chain = genuine tamper signal.
   ========================================================================== */

import { db, isLive } from './db';
import { SUPABASE_URL } from './config';
import { sha256File, anchorBlock, type LedgerAction } from './ledger';
import { sha256Hex } from './ledger';

export type AnchorResult = {
  ok: boolean;
  anchored: boolean;          // true = on-chain tx confirmed
  fileHash: string;
  chainHash?: string;
  txHash?: string;
  reason?: string;
  demo?: boolean;
};

/** Upload path: hash the file bytes client-side for the immediate UI badge,
 *  then let the Edge Function re-hash server-side from Storage (authoritative).
 *  When not live, anchors into the demo ledger so the UI behaves identically. */
export async function anchorDocumentVersion(opts: {
  documentVersionId?: string;
  file?: File | Blob;
  docRef: string;          // human-readable ref for demo ledger (name/version)
  caseRef: string;
  actor: string;
  actorRole?: string | null;
}): Promise<AnchorResult> {
  const fileHash = opts.file ? await sha256File(opts.file) : await sha256Hex(opts.docRef + '|' + Date.now());

  if (isLive() && db && opts.documentVersionId) {
    try {
      const { data: { session } } = await db.auth.getSession();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/anchor-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          },
          body: JSON.stringify({ document_version_id: opts.documentVersionId }),
        },
      );
      const data = await res.json();
      if (res.ok && data.ok) {
        return {
          ok: true,
          anchored: Boolean(data.anchored),
          fileHash: data.fileHash ?? fileHash,
          chainHash: data.chainHash,
          txHash: data.tx,
          reason: data.reason,
        };
      }
      return { ok: false, anchored: false, fileHash, reason: data.error ?? `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, anchored: false, fileHash, reason: String(e) };
    }
  }

  // Demo fallback: same semantics on the local ledger
  const action: LedgerAction = 'DOCUMENT_REGISTERED';
  const r = await anchorBlock({
    action,
    actor: opts.actor,
    actorRole: opts.actorRole ?? null,
    caseRef: opts.caseRef,
    docRef: opts.docRef,
    payloadHash: fileHash,
  });
  return r.ok
    ? { ok: true, anchored: true, fileHash, txHash: 'demo-block#' + r.block.index, demo: true }
    : { ok: false, anchored: false, fileHash, reason: r.error, demo: true };
}

export type ThreeWayVerdict = {
  fileHashLocal: string | null;   // recomputed from stored bytes (when fetchable)
  fileHashDb: string | null;      // document_versions.file_hash
  onChainHash: string | null;
  matchesDbVsChain: boolean | null;
  tamperDetected: boolean;
  mode: 'live' | 'demo';
  detail: string;
};

/** Spec §4 — the genuine three-way check. Demo mode verifies against the
 *  local ledger (same logic, different store), clearly labeled. */
export async function verifyThreeWay(opts: {
  documentVersionId?: string;
  file?: File | Blob | null;
  dbHash?: string | null;
  docRef: string;
}): Promise<ThreeWayVerdict> {
  const localHash = opts.file ? await sha256File(opts.file) : null;

  if (isLive() && db && opts.documentVersionId) {
    try {
      const { data: { session } } = await db.auth.getSession();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/verify-anchor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          },
          body: JSON.stringify({ document_version_id: opts.documentVersionId }),
        },
      );
      const data = await res.json();
      if (res.ok && data.on_chain) {
        const tamper =
          (localHash && opts.dbHash && localHash !== opts.dbHash) ||
          (localHash && data.on_chain_file_hash && localHash !== data.on_chain_file_hash);
        return {
          fileHashLocal: localHash,
          fileHashDb: opts.dbHash ?? data.db_file_hash,
          onChainHash: data.on_chain_file_hash,
          matchesDbVsChain: data.matches_db,
          tamperDetected: Boolean(tamper),
          mode: 'live',
          detail: data.matches_db
            ? 'DB hash matches the on-chain anchor.'
            : 'DB hash does NOT match the chain — investigate immediately.',
        };
      }
      return {
        fileHashLocal: localHash, fileHashDb: opts.dbHash ?? data.db_file_hash ?? null,
        onChainHash: null, matchesDbVsChain: null, tamperDetected: false, mode: 'live',
        detail: data.reason === 'anchoring not configured'
          ? 'Hash chain verified in DB; on-chain anchoring not configured yet.'
          : (data.error ?? 'not anchored'),
      };
    } catch (e) {
      // fall through to demo
    }
  }

  // Demo mode: check the local chain for this doc's latest anchored hash
  const { getChain } = await import('./ledger');
  const chain = await getChain();
  const block = [...chain].reverse().find(b => b.docRef === opts.docRef);
  const tamper = Boolean(localHash && opts.dbHash && localHash !== opts.dbHash);
  return {
    fileHashLocal: localHash,
    fileHashDb: opts.dbHash ?? block?.payloadHash ?? null,
    onChainHash: block?.payloadHash ?? null,
    matchesDbVsChain: block ? (!opts.dbHash || opts.dbHash === block.payloadHash) : null,
    tamperDetected: tamper,
    mode: 'demo',
    detail: block
      ? (tamper ? 'TAMPER: recomputed hash differs from the ledger.' : 'Ledger anchor matches — integrity verified (demo ledger).')
      : 'No ledger anchor found for this document yet.',
  };
}
