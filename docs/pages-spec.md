# S.U.R.Y.A. — Page-by-Page Specification

> Every page in the restructured platform: purpose, layout, elements, auth path,
> data shown, and blockchain touchpoints. Written for the SIH report and for judges
> who ask "what am I looking at?"

Platform rule visible everywhere: **AI assists, it never decides** · demo-mode
features are labeled as such; production requirements are noted inline.

---

## 1. Landing Page (`SuryaLanding.tsx`)

**Purpose:** one identity-first front door for the whole platform.

**Layout (top → bottom):**
1. **Tricolor strip** — 4px India-flag gradient across the top.
2. **Top bar** — left: S.U.R.Y.A. serif wordmark + "Smart Unified Resource for
   Judicial Assistance" subtitle; right: **"SURYA for Judicial Assistance"**
   button (navy, gold text; lifts on hover) + light/dark toggle.
3. **Hero (the main element)** — concentric gold rings, a ☸ chakra glyph, then
   the giant **S.U.R.Y.A. wordmark** in gradient serif (crimson → gold → teal),
   with the tagline "ONE SECURE IDENTITY. EVERY JUDICIAL SERVICE."
4. **The single Login button** — pill-shaped, navy; **pops on hover**
   (`scale(1.06)` + deeper shadow). This is the DMS door.
5. Footer — demo notice, AI disclaimer, tech keywords.

**Actions:** `Login` → DigiLocker (PIN door) · `SURYA for Judicial Assistance`
→ role-cards popup → DigiLocker (OTP door).

---

## 2. DigiLocker Authentication Mock (`DigiLockerAuth.tsx`)

**Purpose:** mirror the real DigiLocker sign-in so the audience immediately
recognizes India's actual identity layer; prove the platform never stores
passwords — identity comes from a government verifier.

**Look:** official DigiLocker header (logo tile, "Digitise India, Digitise the
Nation", Govt. of India badge), an amber **requester strip** ("You are signing
in to S.U.R.Y.A. … via DigiLocker authentication" — the OAuth requester concept),
and a centered sign-in card.

**Two channels:**
| Door | Step 1 | Step 2 | Used by |
|---|---|---|---|
| PIN | +91 mobile number | 6-digit **Security PIN** | DMS officers |
| OTP | +91 mobile number | 6-digit **OTP** | Suite (citizen/lawyer/student) |

**Behavior:** numeric-only inputs, Enter-to-submit, busy states, precise errors
("No DigiLocker account exists for this number…"), every attempt appended to
the audit log (`DIGILOCKER_PIN_OK`, `DIGILOCKER_OTP_FAILED`, …).
Demo codes are in `docs/demo-credentials.md` — never rendered in the UI.

**Production note:** replace the mock with real DigiLocker OAuth 2.0
(requester id + consent screen); the binding logic below is unchanged.

---

## 3. Officer Identification (DMS door, step 2) (`AuthFlows.tsx → DmsUniqueIdStep`)

**Purpose:** bind the verified person to an officer record and let the
**database — not the user — decide the role**.

**Layout:** "Officer Identification" card on the government-portal background.
Shows the DigiLocker-verified name + phone, one **Unique ID input** with an
**Enter** button, and a green trust note: *"Your role and department are
derived from government records linked to this Unique ID — they cannot be
self-selected."*

**Logic (`dmsResolveOfficer`):**
1. ID unknown → "No officer record exists for this ID."
2. ID exists but `officer.phone ≠ digilocker.phone` → **"registered to a
   different DigiLocker account"** — this is the privilege-escalation killer
   (verified live: Dr. Iyer's phone + IO-2026-0142 is rejected).
3. Match → role, department, jurisdiction, clearance all read from the record;
   session created; `DMS_LOGIN_OK` audited; route to the role's dashboard.

**Why no role dropdown:** a dropdown lets anyone claim "Super Admin" with a
leaked ID. Here a valid ID without the matching phone is worthless.

---

## 4. Role Cards Popup (suite door) (`AuthFlows.tsx → SuiteRoleCards`)

**Purpose:** the entry modal for the assistance suite — the three familiar
role cards (Citizen / Lawyer / Student) in the original format.

**Layout:** dark overlay → white popup, header "S.U.R.Y.A. for Judicial
Assistance", three hover-lifting cards (orange/blue/green) with icon tiles,
"I am a …" headings, promise lines, and a Continue affordance. Footer note:
"Verified via DigiLocker · No data is shared without your consent."

**Behavior:** picks channel `otp` and remembers the chosen role for the
post-OTP resolution.

---

## 5. Advocate Verification (lawyer's second layer) (`AuthFlows.tsx → LawyerBarIdStep`)

**Purpose:** DigiLocker proves the person; the **Bar enrollment ID proves the
advocate**. Mirrors the real system (State Bar Council enrollment
`STATE/NUMBER/YEAR` + Certificate of Practice).

**Layout:** "Advocate Verification" card, input with format hint
(`STATE/NUMBER/YEAR — issued by your State Bar Council`), then a **"Verifying
with the State Bar Council…"** spinner state during the check.

**Logic (`verifyAdvocate`):** unknown ID → formatted rejection; ID exists but
bound to another phone → "registered to a different DigiLocker account";
`cop_verified = false` → blocked with a COP message. Pass → lawyer session
carries `barEnrollmentId` + `stateBarCouncil`; `ADVOCATE_VERIFY_OK` audited.

---

## 6–11. The Six DMS Dashboards (`DmsDashboards.tsx`)

All six live inside `DMSWorkspace` (navy sidebar with the officer's identity,
header with department + "Encrypted workspace", AI Assistant fab). Routing:
landing → DigiLocker PIN → Unique ID → the dashboard matching the DB role.

| Role | Dashboard thesis | Signature panels |
|---|---|---|
| **Investigating Officer** | "Your cases, documents and evidence — one desk" | My active cases / pending tasks / uploads / verified KPIs · task list (verify OCR'd FIR fields, sign charge sheet, review statement) · department activity |
| **Forensic Officer** | "Evidence integrity first" | Evidence in my custody (hash-verified) · reports & examinations (upload → sign → hash) · verify-integrity action |
| **Court / Registrar** | "Review, verify, never alter" | Case files under review · **verification checklist** (hash vs ledger, signature validity, custody completeness) · explicit read-only note |
| **Legal Officer** | "From investigation to court submission" | Documents awaiting action · **AI-assisted case brief** (summary, missing docs flagged) with disclaimer |
| **Records / Compliance** | "Nothing moves without a record" | Audit event feed · retention & integrity watchlist (legal holds, cross-system reads) |
| **System Admin** | "System control center" | Users/cases/documents KPIs · **system activity timeline** · **security center** (failed logins, MFA policy, rate-limit events) |

**Shared pages** (sidebar): My Service Details (service record, postings,
clearance), Document Repository (search + filters + case tree), Case File
(metadata, versions, evidence, DMS-records bridge), Upload & Digitize
(**real SHA-256 of file bytes at upload**), Access Control (permission matrix,
time-bound grants), Audit Trail (append-only + CSV), Integrity & Verification,
**Integrity Ledger**, Secure Sharing (expiry, watermark, redaction), Search &
Retrieval, Compliance & Retention, Admin Panel.

---

## 12. Integrity Ledger (the blockchain page) (`LedgerExplorer` in DMSWorkspace)

**Purpose:** make the anti-tamper guarantee *visible*.

**Elements:** stats bar (blocks, chain tip, documents anchored, last verdict);
controls **Verify chain / Simulate tamper / Repair (demo) / Reset demo**;
ledger table (action chips, actor + officer ID, `hash → prev` links,
timestamps); block inspector (64-char hashes, payload hash, nonce, formula).

**Demo choreography:** Verify → green "CHAIN VERIFIED"; Simulate tamper →
attacker edits a historical block → Verify → red **"INTEGRITY VERIFICATION
FAILED — block #N (hash-mismatch)"** with all downstream rows flagged;
Repair → green again. In live mode tamper/repair are disabled — the server
table is *genuinely* append-only (insert-only RLS, UPDATE/DELETE revoked).

**What the chain stores:** only SHA-256 commitments + actor + case/doc refs +
prev-hash + nonce. **Documents never go on the chain** (confidentiality, DPDP
erasure, cost). Actions anchored: DOCUMENT_REGISTERED, VERSION_CREATED,
EVIDENCE_COLLECTED, EVIDENCE_TRANSFER, SIGNATURE_APPLIED, SHARE_CREATED,
LEGAL_HOLD_*, INTEGRITY_VERIFIED.

---

## 13. Assistance Suite Dashboards (existing, preserved)

Entered via the role-cards popup → OTP door:

- **Citizen** — situation cards ("Phone theft", "Online fraud"…) that auto-send
  to the Gemini chatbot; My Legal Steps tracker; Find-a-Lawyer (rating +
  experience + request flow); Know-Your-Rights grid; helplines.
- **Lawyer** — case command center (AI Case Visualizer graph, priority queue,
  timeline, hearings) + My Clients chat, Document Analyzer, calendar.
- **Student** — case library with domain/location/year filters, simplified vs
  detailed toggles, My Case Studies with history, AI quiz generator.

All three keep session persistence, dark mode, and the AI disclaimer.

---

## 14. Supabase backend (when keys are set)

`supabase/schema.sql` creates: `digilocker_identities`, `dms_officers`,
`advocates`, `suite_users`, `cases`, `documents` (+versions), `evidence`
(+custody_events), `shares`, `audit_log`, **`ledger_blocks` (append-only)**,
`ledger_anchors` — all under RLS. The client (`src/lib/db.ts`,
`src/lib/auth.ts`, `src/lib/ledger.ts`) switches to live mode automatically
when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` exist in `.env.local`;
otherwise the identical UI runs on the demo store.

**Tier 3 (queued):** periodic Merkle root of new ledger blocks anchored to
Polygon Amoy; tx hash stored in `ledger_anchors`; toggle-guarded so the demo
never depends on network.
