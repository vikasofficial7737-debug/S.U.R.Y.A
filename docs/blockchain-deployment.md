# S.U.R.Y.A. — Blockchain & Backend Deployment Guide

From zero to live on-chain anchoring. ~30 minutes.

---

## 0. Architecture in one line

Browser → Supabase (Postgres + Auth + RLS + Storage) → **Edge Function holds the wallet key** → Polygon Amoy (`DocumentAnchor.sol`). Only SHA-256 hashes + opaque IDs touch the chain. Verify = free read, independent of our database.

---

## 1. Burner wallet + test MATIC (5 min)

```bash
# In any terminal with node installed — creates a throwaway key
node -e "const {Wallet}=require('ethers');const w=Wallet.createRandom();console.log('address:',w.address);console.log('privateKey:',w.privateKey)"
```

> ⚠️ This wallet must hold **Amoy test MATIC only** — never fund it with real assets, never reuse a personal wallet.

Fund it from a faucet (need ~2 test MATIC):
- https://faucet.polygon.technology/ (choose **Polygon Amoy**)
- or https://www.alchemy.com/faucets/polygon-amoy

---

## 2. Deploy the contract (10 min, Remix — no toolchain install)

1. Open https://remix.ethereum.org
2. Create `DocumentAnchor.sol`, paste `contracts/DocumentAnchor.sol` from this repo
3. Compile: Solidity **0.8.24+**, EVM default
4. Deploy tab → Environment: **"Injected Provider — MetaMask"** (add the **Amoy** network in MetaMask: chainId **80002**, RPC `https://rpc-amoy.polygon.tech`)
5. Import the burner private key into a **fresh MetaMask profile** used only for this
6. Deploy → confirm → **copy the deployed contract address**

---

## 3. Supabase database (5 min)

Run these **in order** (they are split because they own different tables —
running the old combined `schema.sql` alongside them would collide on
`cases` / `documents`):

1. SQL Editor → run **`supabase/schema-v2.sql`** → spec tables, RLS, JWT hook, storage bucket, demo departments + case
2. SQL Editor → run **`supabase/schema-identity.sql`** → DigiLocker identity bindings (`digilocker_identities`, `dms_officers`, `advocates`, `suite_users`) + the integrity `ledger_blocks` the S.U.R.Y.A. auth flow and client ledger use, with demo users seeded
3. Auth hook for JWT claims: **Dashboard → Authentication → Hooks (Edge Function)** — enable the **Custom Access Token Hook** and point it at `custom_access_token_hook` (created by schema-v2). This puts `role` and `department_id` into the JWT so RLS is query-free.

> ℹ️ `supabase/schema.sql` is the legacy single-file version — keep it only for
> reference. Use the v2 + identity pair above for anything you deploy.

---

## 4. Edge Function secrets (2 min)

```bash
supabase login
supabase link --project-ref iuoupzfazskgizkqrcai

supabase secrets set \
  ANCHOR_WALLET_PRIVATE_KEY=0x<burner-private-key> \
  AMOY_RPC_URL=https://rpc-amoy.polygon.tech \
  DOCUMENT_ANCHOR_ADDRESS=0x<deployed-address> \
  SOLAR_API_KEY=<upstage-key>            # or GEMINI_API_KEY=<key>
```

> 🔑 These are server-side only. `.env.local` must never contain them (see `.env.example`).

---

## 5. Deploy the functions (3 min)

```bash
supabase functions deploy anchor-document
supabase functions deploy verify-anchor
supabase functions deploy classify-document
supabase functions deploy semantic-search
```

---

## 6. Create test users (3 min)

The `users` table is keyed to `auth.users` — create a real Auth user, then add its row:

```sql
-- after creating e.g. officer@demo.gov via Dashboard → Authentication → Add user
insert into users (id, name, role, department_id)
select id, 'Demo Officer', 'investigating_officer',
       (select id from departments where name like 'Jaipur Police%')
from auth.users where email = 'officer@demo.gov'
on conflict (id) do nothing;
```

Repeat for a `compliance_officer` and a `student` (they should see *different* documents — that's RLS being real).

---

## 7. End-to-end test checklist

| # | Test | Expected |
|---|---|---|
| 1 | Upload a document as the officer | `document_versions` row: `on_chain_status='pending'` → `'anchored'`, real `on_chain_tx_hash` |
| 2 | Open the tx hash on https://amoy.polygonscan.com | `DocumentAnchored` event visible; input data = hashes only |
| 3 | Integrity page → verify | Three-way check: local file hash = DB hash = on-chain hash → green |
| 4 | **Tamper test**: re-upload a modified file at the same path | recomputed hash ≠ chain hash → red tamper flag |
| 5 | Log in as the student | Documents not marked `is_public` and not granted are **invisible** (RLS, not UI hiding) |
| 6 | As student, call `documents` via REST with a forged role claim | Rows still filtered — Postgres doesn't trust the client |
| 7 | Try `update`/`delete` on `audit_log` via REST | Denied — no such privilege exists for client roles |
| 8 | Same version re-anchor (idempotency) | No conflicting write; identical re-anchor is a no-op |
| 9 | Anchor a *different* hash for the same version | Contract **reverts** with `ConflictingHash` |

---

## 8. Honest production notes (for the report)

- **Supabase is a managed third party.** Sovereign/air-gapped deployments need self-hosted Postgres + Storage — feasible later because the stack is open source; not what this build does.
- **Amoy is a testnet.** Production anchoring targets Polygon PoS mainnet or a permissioned chain; the contract is unchanged.
- **docCode derivation** uses FNV-1a + id for the demo; swap to `keccak256(uuid_bytes)` in production (one line in both Edge Functions).
- The anchor wallet is a single hot key for demo economics; production uses a KMS/HSM-backed signer with a multisig owner on the contract.

---

## 9. What still works with zero configuration

Without steps 1–7, the entire app runs identically on the demo ledger + demo store (`isLive() === false`): same UI, same flows, same tamper demo — clearly labeled "demo ledger" instead of "Polygon Amoy". Nothing in the classroom demo depends on network access.
