# S.U.R.Y.A. — Demo Credentials Sheet (internal, not shown in UI)

> This file is for the presenter/team only. Nothing here renders inside the app.
> In live mode these rows exist in Supabase via `supabase/schema.sql` seed.
> In demo mode the same rows live in `src/data/identityBindings.ts`.

## DigiLocker mock — universal codes
| Code | Value |
|---|---|
| DMS PIN (door 1: DMS Login) | `123456` |
| Suite OTP (door 2: Judicial Assistance) | `123456` |

Phone format: 10 digits, or with `91` prefix. Any phone below works with either code.

## Door 1 — DMS Login (DigiLocker PIN → Unique ID)
Role is **derived from the database** — no role selection. The Unique ID must be
linked to the DigiLocker phone used in step 1.

| Phone | Unique ID | Person | Role | Department |
|---|---|---|---|---|
| 98765 00001 | `IO-2026-0142` | Rajesh Kumar Sharma | Investigating Officer | Jaipur Police — Crime Branch |
| 98765 00002 | `FO-2026-0451` | Dr. Rohan Iyer | Forensic Officer | FSL — DNA & Digital |
| 98765 00003 | `CR-2026-0087` | Anita Desai | Court / Registrar | Sessions Court Jaipur |
| 98765 00004 | `LO-2026-0219` | Vikram Rao | Legal Officer / Prosecutor | Public Prosecutor Office |
| 98765 00005 | `RC-2026-0104` | Sneha Kulkarni | Records / Compliance | State Records & Compliance Cell |
| 98765 00006 | `SA-2026-0001` | Adv. Meera Bhatt | System Administrator | NIC Platform Administration |

Binding-failure demo: login with phone `98765 00002` then enter `IO-2026-0142`
→ rejected: "registered to a different DigiLocker account".

## Door 2 — Judicial Assistance suite (DigiLocker OTP → role card)
| Phone | Suite role | Person | Notes |
|---|---|---|---|
| 98765 00001 | Citizen | Rajesh Kumar Sharma | also an officer (dual persona by design) |
| 98765 00005 | Citizen | Sneha Kulkarni | |
| 98765 00007 | Student | Karan Malhotra | |
| 98765 00004 | Lawyer | Vikram Rao | **requires layer 2** |

Role-card mismatch (tap Citizen with a student phone) → politely redirected to
the right card — DB is the source of truth.

## Lawyer layer 2 — Bar enrollment verification
| Bar enrollment ID | Bound phone | Person | State Bar Council |
|---|---|---|---|
| `RAJ/1823/2019` | 98765 00004 | Vikram Rao | Bar Council of Rajasthan |
| `DEL/0917/2016` | 98765 00007 | Karan Malhotra | Bar Council of Delhi |

Flow: OTP door → tap **Lawyer** card → enter Bar ID → verified against
`advocates.phone == digilocker phone` → lawyer dashboard.

Binding-failure demo: phone `98765 00001` + `RAJ/1823/2019` → rejected.

## Negative-test one-liners (great for Q&A)
- Wrong PIN → rejected before identity lookup.
- Unknown Unique ID → "No officer record exists for this ID."
- Right ID, wrong phone → binding denied (the privilege-escalation killer).
- Unverified Certificate of Practice → lawyer blocked.
