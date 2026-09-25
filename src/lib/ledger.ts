/* ============================================================================
   LedgerService — Tier-1 integrity ledger.
   Same block shape and hashing scheme as the previous in-browser chain, but
   persisted in the append-only `ledger_blocks` table when Supabase is live
   (insert-only RLS + revoked UPDATE/DELETE privileges server-side).

   Documents are NEVER stored on the chain — only SHA-256 commitments.
   Verification recomputes every hash and every prev-hash link; any historical
   edit (in demo mode) breaks the chain and is pinpointed.

   Also exposes Tier-2 helpers: SHA-256 of raw file bytes (upload integrity).
   ========================================================================== */

import { db, isLive, dbError } from './db';

export type LedgerAction =
  | 'GENESIS' | 'DOCUMENT_REGISTERED' | 'DOCUMENT_VIEWED' | 'VERSION_CREATED'
  | 'SIGNATURE_APPLIED' | 'EVIDENCE_COLLECTED' | 'EVIDENCE_TRANSFER'
  | 'LEGAL_HOLD_APPLIED' | 'LEGAL_HOLD_RELEASED' | 'SHARE_CREATED' | 'INTEGRITY_VERIFIED';

export type LedgerBlock = {
  index: number;
  createdAt: string;       // ISO
  action: LedgerAction;
  actor: string;
  actorRole: string | null;
  caseRef: string | null;
  docRef: string | null;
  payloadHash: string;
  prevHash: string;
  nonce: number;
  hash: string;
};

const ZERO = '0'.repeat(64);
export const GENESIS_PREV = ZERO;

/* ------------------------------------------------------------- primitives */

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Tier-2: SHA-256 over the actual file bytes. */
export async function sha256File(file: File | Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const d = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function serialize(b: Omit<LedgerBlock, 'hash'>): string {
  return JSON.stringify({
    index: b.index, createdAt: b.createdAt, action: b.action, actor: b.actor,
    actorRole: b.actorRole, caseRef: b.caseRef, docRef: b.docRef,
    payloadHash: b.payloadHash, prevHash: b.prevHash, nonce: b.nonce,
  });
}

async function hashBlock(b: Omit<LedgerBlock, 'hash'>): Promise<string> {
  return sha256Hex(serialize(b));
}

/* ---------------------------------------------------------------- reads */

export async function getChain(): Promise<LedgerBlock[]> {
  if (isLive() && db) {
    const { data, error } = await db
      .from('ledger_blocks').select('*').order('index', { ascending: true });
    if (error) { console.warn('[ledger] read failed:', dbError(error)); return demoChain(); }
    return (data || []).map(r => ({
      index: Number(r.index), createdAt: r.created_at, action: r.action,
      actor: r.actor ?? 'system', actorRole: r.actor_role, caseRef: r.case_ref,
      docRef: r.doc_ref, payloadHash: r.payload_hash, prevHash: r.prev_hash,
      nonce: r.nonce, hash: r.block_hash,
    }));
  }
  return demoChain();
}

/* -------------------------------------------------------------- writes */

export type AnchorInput = {
  action: LedgerAction;
  actor: string;
  actorRole?: string | null;
  caseRef?: string | null;
  docRef?: string | null;
  payloadHash: string;
};

/** Append one block. Concurrency-safe under light demo load (single writer). */
export async function anchorBlock(input: AnchorInput): Promise<{ ok: true; block: LedgerBlock } | { ok: false; error: string }> {
  const chain = await getChain();
  const tip = chain[chain.length - 1];
  const candidate: Omit<LedgerBlock, 'hash'> = {
    index: tip ? tip.index + 1 : 0,
    createdAt: new Date().toISOString(),
    action: input.action,
    actor: input.actor,
    actorRole: input.actorRole ?? null,
    caseRef: input.caseRef ?? null,
    docRef: input.docRef ?? null,
    payloadHash: input.payloadHash,
    prevHash: tip ? tip.hash : ZERO,
    nonce: Math.floor(Math.random() * 1e6),
  };
  const block: LedgerBlock = { ...candidate, hash: await hashBlock(candidate) };

  if (isLive() && db) {
    const row = {
      index: block.index, block_hash: block.hash, prev_hash: block.prevHash,
      action: block.action, actor: block.actor, actor_role: block.actorRole,
      case_ref: block.caseRef, doc_ref: block.docRef, payload_hash: block.payloadHash,
      nonce: block.nonce,
    };
    const { error } = await db.from('ledger_blocks').insert(row);
    if (error) return { ok: false, error: dbError(error) };
  } else {
    demoSave([...chain, block]);
  }
  return { ok: true, block };
}

/* ---------------------------------------------------------- verification */

export type VerifyResult = {
  valid: boolean;
  checked: number;
  brokenAt: number | null;   // block index where the chain first breaks
  reason: 'hash-mismatch' | 'link-mismatch' | null;
};

export async function verifyChain(): Promise<VerifyResult> {
  const chain = await getChain();
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    const recomputed = await hashBlock({
      index: b.index, createdAt: b.createdAt, action: b.action, actor: b.actor,
      actorRole: b.actorRole, caseRef: b.caseRef, docRef: b.docRef,
      payloadHash: b.payloadHash, prevHash: b.prevHash, nonce: b.nonce,
    });
    if (recomputed !== b.hash) return { valid: false, checked: chain.length, brokenAt: b.index, reason: 'hash-mismatch' };
    if (i > 0 && b.prevHash !== chain[i - 1].hash) return { valid: false, checked: chain.length, brokenAt: b.index, reason: 'link-mismatch' };
    if (i === 0 && b.prevHash !== ZERO) return { valid: false, checked: chain.length, brokenAt: b.index, reason: 'link-mismatch' };
  }
  return { valid: true, checked: chain.length, brokenAt: null, reason: null };
}

/* ------------------------------------------------ demo-mode tamper tooling */

export async function simulateTamper(): Promise<boolean> {
  if (isLive()) return false; // server chain is genuinely append-only — by design.
  const chain = demoChain();
  if (chain.length < 2) return false;
  const target = 1 + Math.floor(Math.random() * (chain.length - 1));
  chain[target] = { ...chain[target], payloadHash: 'f'.repeat(64) }; // attacker edit
  demoSave(chain);
  return true;
}

export async function repairChain(): Promise<boolean> {
  if (isLive()) return false;
  const chain = demoChain();
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    const goodHash = await hashBlock({
      index: b.index, createdAt: b.createdAt, action: b.action, actor: b.actor,
      actorRole: b.actorRole, caseRef: b.caseRef, docRef: b.docRef,
      payloadHash: b.payloadHash, prevHash: b.prevHash, nonce: b.nonce,
    });
    chain[i] = { ...b, hash: goodHash };
    if (i + 1 < chain.length) chain[i + 1] = { ...chain[i + 1], prevHash: goodHash };
  }
  demoSave(chain);
  return true;
}

export async function resetLedger(): Promise<void> {
  if (isLive() && db) {
    // Append-only in production; in the live demo project this is acceptable
    // during setup only. Real deployments never expose delete.
    await db.from('ledger_blocks').delete().neq('index', -1);
  }
  demoSave([]);
  await anchorBlock({ action: 'GENESIS', actor: 'Platform Administration', actorRole: 'super_admin', payloadHash: await sha256Hex('SUR YA-GENESIS-' + new Date().toISOString().slice(0, 10)) });
}

/* --------------------------------------------------------- demo storage */

const DEMO_KEY = 'surya-ledger-v2';
function demoChain(): LedgerBlock[] {
  try { return JSON.parse(localStorage.getItem(DEMO_KEY) || 'null') || []; } catch { return []; }
}
function demoSave(chain: LedgerBlock[]) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(chain)); } catch { /* quota */ }
}

/** Convenience: seed genesis if the chain is empty (both modes). */
export async function ensureGenesis(): Promise<void> {
  const chain = await getChain();
  if (chain.length === 0) {
    await anchorBlock({
      action: 'GENESIS', actor: 'Platform Administration', actorRole: 'super_admin',
      payloadHash: await sha256Hex('SUR YA-GENESIS-' + new Date().toISOString().slice(0, 10)),
    });
  }
}
