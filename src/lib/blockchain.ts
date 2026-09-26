/* ============================================================================
   S.U.R.Y.A. Integrity Ledger — a real, verifiable hash chain.
   ----------------------------------------------------------------------------
   Design (per SIH spec §16):
     • Documents are NOT stored on the chain — only their SHA-256 hashes,
       uploader identity, case reference, and timestamps.
     • Each block contains: index, timestamp, action type, payload hash,
       actor, caseId, previous block hash. Block hash = SHA-256(serialized block).
     • Changing ANY historical byte breaks every hash after it → tamper-evident.
     • In production the same chain lives on a permissioned ledger (Hyperledger
       Fabric / Supabase table + notarization anchor); the verification logic
       below is identical, only the storage backend differs.
   ========================================================================== */

export type LedgerAction =
  | 'GENESIS'
  | 'DOCUMENT_REGISTERED'
  | 'DOCUMENT_VIEWED'
  | 'VERSION_CREATED'
  | 'SIGNATURE_APPLIED'
  | 'EVIDENCE_TRANSFER'
  | 'LEGAL_HOLD_APPLIED'
  | 'LEGAL_HOLD_RELEASED'
  | 'SHARE_CREATED'
  | 'INTEGRITY_VERIFIED';

export type LedgerBlock = {
  index: number;
  timestamp: string;          // ISO
  action: LedgerAction;
  actor: string;              // officer name + role
  actorId: string;            // officer ID
  caseId: string;
  documentName: string;
  payloadHash: string;        // SHA-256 hex of the document/metadata payload
  previousHash: string;       // hex of previous block's hash ('0'.repeat(64) for genesis)
  nonce: number;
  hash: string;               // SHA-256 hex of this block
};

const CHAIN_KEY = 'surya-integrity-ledger-v1';
const ZERO_HASH = '0'.repeat(64);

/* ---------- real SHA-256 via Web Crypto ---------- */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeBlockHash(b: Omit<LedgerBlock, 'hash'>): Promise<string> {
  const serialized = JSON.stringify({
    index: b.index, timestamp: b.timestamp, action: b.action, actor: b.actor, actorId: b.actorId,
    caseId: b.caseId, documentName: b.documentName, payloadHash: b.payloadHash,
    previousHash: b.previousHash, nonce: b.nonce,
  });
  return sha256Hex(serialized);
}

/* ---------- persistence ---------- */
function load(): LedgerBlock[] {
  try { return JSON.parse(localStorage.getItem(CHAIN_KEY) || 'null') || []; } catch { return []; }
}
function save(chain: LedgerBlock[]) {
  try { localStorage.setItem(CHAIN_KEY, JSON.stringify(chain)); } catch { /* quota — in-memory still works */ }
}

/* ---------- genesis ---------- */
export async function ensureGenesis(actor = 'Platform Administration', actorId = 'AD-2026-0001'): Promise<LedgerBlock[]> {
  const chain = load();
  if (chain.length) return chain;
  const genesis: Omit<LedgerBlock, 'hash'> = {
    index: 0, timestamp: new Date().toISOString(), action: 'GENESIS',
    actor, actorId, caseId: '—', documentName: 'S.U.R.Y.A. integrity ledger initialization',
    payloadHash: await sha256Hex('S.U.R.Y.A.-GENESIS-' + new Date().toISOString().slice(0, 10)),
    previousHash: ZERO_HASH, nonce: 0,
  };
  const block: LedgerBlock = { ...genesis, hash: await computeBlockHash(genesis) };
  const next = [block];
  save(next);
  return next;
}

/* ---------- append ---------- */
export async function appendBlock(params: {
  action: LedgerAction; actor: string; actorId: string; caseId: string;
  documentName: string; payload: string;
}): Promise<LedgerBlock> {
  const chain = await ensureGenesis();
  const previous = chain[chain.length - 1];
  const payloadHash = await sha256Hex(params.payload);
  const candidate: Omit<LedgerBlock, 'hash'> = {
    index: chain.length,
    timestamp: new Date().toISOString(),
    action: params.action,
    actor: params.actor,
    actorId: params.actorId,
    caseId: params.caseId,
    documentName: params.documentName,
    payloadHash,
    previousHash: previous.hash,
    nonce: 0,
  };
  const block: LedgerBlock = { ...candidate, hash: await computeBlockHash(candidate) };
  const next = [...chain, block];
  save(next);
  return block;
}

/* ---------- verification ----------
   Recomputes every hash and every link. Returns the first broken index if any. */
export type ChainVerification = {
  valid: boolean;
  length: number;
  brokenAtIndex: number | null;   // first block whose recomputed hash mismatches
  brokenReason: 'hash-mismatch' | 'link-mismatch' | null;
  checkedAt: string;
};

export async function verifyChain(): Promise<ChainVerification> {
  const chain = load();
  const checkedAt = new Date().toISOString();
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    const recomputed = await computeBlockHash(b);
    if (recomputed !== b.hash) return { valid: false, length: chain.length, brokenAtIndex: i, brokenReason: 'hash-mismatch', checkedAt };
    const expectedPrev = i === 0 ? ZERO_HASH : chain[i - 1].hash;
    if (b.previousHash !== expectedPrev) return { valid: false, length: chain.length, brokenAtIndex: i, brokenReason: 'link-mismatch', checkedAt };
  }
  return { valid: true, length: chain.length, brokenAtIndex: null, brokenReason: null, checkedAt };
}

/* ---------- demo helpers (clearly labeled in UI) ---------- */

/** Tamper with a historical block to DEMONSTRATE detection. Demo-only. */
export function simulateTamper(index: number, newActor = 'Mallory Attacker'): boolean {
  const chain = load();
  if (index <= 0 || index >= chain.length) return false;
  chain[index] = { ...chain[index], actor: newActor }; // NOT recomputing hash → chain breaks here
  save(chain);
  return true;
}

/** Re-mine a tampered chain (would be impossible in production — that's the point). Demo-only repair. */
export async function repairChain(): Promise<number> {
  const chain = load();
  let fixed = 0;
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    const expectedPrev = i === 0 ? ZERO_HASH : chain[i - 1].hash;
    const needsHash = await computeBlockHash(b) !== b.hash;
    const needsLink = b.previousHash !== expectedPrev;
    if (needsHash || needsLink) {
      const fixedBlock: LedgerBlock = { ...b, previousHash: expectedPrev };
      fixedBlock.hash = await computeBlockHash(fixedBlock);
      chain[i] = fixedBlock;
      fixed++;
    }
  }
  save(chain);
  return fixed;
}

/** Reset demo ledger. */
export function resetLedger(): void { localStorage.removeItem(CHAIN_KEY); }

export const getChain = (): LedgerBlock[] => load();

export const blocksForDocument = (name: string): LedgerBlock[] =>
  load().filter(b => b.documentName === name);

export const ledgerStats = () => {
  const chain = load();
  return {
    length: chain.length,
    lastHash: chain[chain.length - 1]?.hash?.slice(0, 16) + '…' || '—',
    firstTime: chain[0]?.timestamp,
    lastTime: chain[chain.length - 1]?.timestamp,
  };
};
