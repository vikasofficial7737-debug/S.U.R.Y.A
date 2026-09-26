-- ============================================================================
-- S.U.R.Y.A. — IDENTITY & LEDGER layer (safe to run alongside schema-v2.sql)
--
-- Split out of schema.sql to avoid a table collision: schema-v2.sql owns the
-- DMS core (cases, documents, document_versions, users, access_grants, ...),
-- while this file owns the identity bindings + integrity ledger that the
-- S.U.R.Y.A. authentication flow and the client ledger service use.
--
-- RUN ORDER: schema-v2.sql  ->  schema-identity.sql
-- ============================================================================

-- ============================================================================
-- S.U.R.Y.A. — Unified Legal & Judicial Platform
-- Complete Supabase schema (PostgreSQL 15+) with Row Level Security.
-- Run in Supabase SQL Editor (or `supabase db push`).
--
-- Security model:
--   * Every table has RLS. Access derives from the authenticated user's
--     linked digilocker identity -> role bindings -> case assignment ->
--     document classification.
--   * ledger_blocks is APPEND-ONLY: insert policy only; no update/delete
--     grant exists for any role (enforced by privileges, not just policy).
-- ============================================================================

-- ---------------------------------------------------------------- extensions
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------- enums
create type user_role as enum (
  'super_admin','department_admin','investigating_officer','forensic_officer',
  'legal_officer','court_registrar','records_compliance',
  'citizen','lawyer','student'
);

create type doc_classification as enum ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED');

create type doc_status as enum (
  'DRAFT','UPLOADED','OCR_PROCESSING','PENDING_VERIFICATION','VERIFIED','SIGNED','ARCHIVED'
);

create type case_status as enum (
  'REGISTERED','INVESTIGATION','EVIDENCE_COLLECTION','LEGAL_REVIEW',
  'COURT_SUBMISSION','UNDER_TRIAL','DISPOSED','ARCHIVED'
);

create type custody_status as enum ('IN_CUSTODY','WITH_FORENSIC','IN_COURT','RETURNED','DISPOSED');

-- ============================================================================
-- 1. IDENTITY LAYER — DigiLocker bindings
-- ============================================================================

-- One row per verified DigiLocker account (mock of the real DigiLocker KYC).
create table if not exists digilocker_identities (
  phone            text primary key,                 -- E.164-ish, e.g. 919876543210
  digilocker_ref   text unique not null,             -- mock DL ref id
  full_name        text not null,
  dob              date,
  gender           text,
  photo_url        text,
  kyc_verified_at  timestamptz default now(),
  created_at       timestamptz default now()
);

-- DMS officers: unique_id <-> digilocker binding. Role lives HERE, server-side.
create table if not exists dms_officers (
  unique_id        text primary key,                 -- e.g. IO-2026-0142
  phone            text not null references digilocker_identities(phone),
  role             user_role not null check (role in
                     ('super_admin','department_admin','investigating_officer',
                      'forensic_officer','legal_officer','court_registrar','records_compliance')),
  full_name        text not null,
  department       text not null,
  unit             text,
  police_station   text,
  jurisdiction     text not null default 'National',
  clearance        doc_classification not null default 'INTERNAL',
  badge_no         text,
  rank             text,
  joined_on        date,
  active           boolean not null default true,
  created_at       timestamptz default now()
);
create index if not exists idx_officers_phone on dms_officers(phone);

-- Advocates (lawyers): bar enrollment id <-> digilocker binding (second layer).
create table if not exists advocates (
  bar_enrollment_id text primary key,                -- e.g. RAJ/1823/2019 (STATE/NUM/YEAR)
  phone             text not null references digilocker_identities(phone),
  full_name         text not null,
  state_bar_council text not null,                   -- e.g. Bar Council of Rajasthan
  enrollment_year   int  not null,
  practice_areas    text[] default '{}',
  cop_verified      boolean not null default false,  -- Certificate of Practice
  active            boolean not null default true,
  created_at        timestamptz default now()
);
create index if not exists idx_advocates_phone on advocates(phone);

-- Assistance-suite users (citizen / student; lawyers live in `advocates`).
create table if not exists suite_users (
  phone        text primary key references digilocker_identities(phone),
  suite_role   user_role not null check (suite_role in ('citizen','lawyer','student')),
  full_name    text not null,
  city         text,
  state        text,
  created_at   timestamptz default now()
);

-- ============================================================================
-- 3. AUDIT — append-only activity log
-- ============================================================================

create table if not exists audit_log (
  id          bigserial primary key,
  actor       text,
  actor_role  user_role,
  action      text not null,                         -- VIEW | DOWNLOAD | SHARE | LOGIN_FAILED ...
  resource    text,
  case_ref    text,
  ip_hint     text,
  details     jsonb default '{}',
  happened_at timestamptz not null default now()
);
-- Append-only: nobody updates or deletes audit rows.
revoke update, delete on audit_log from public;

-- ============================================================================
-- 4. BLOCKCHAIN TIER 1 — append-only hash-chain ledger
--    (documents are NEVER stored here; only SHA-256 commitments)
-- ============================================================================

create table if not exists ledger_blocks (
  index        bigint primary key,
  block_hash   text not null unique,                 -- SHA-256(index|ts|actor|action|payload_hash|prev_hash|nonce)
  prev_hash    text not null,                        -- genesis prev = '0'*64
  action       text not null,                        -- DOCUMENT_REGISTERED | VERSION_CREATED | ...
  actor        text,
  actor_role   user_role,
  case_ref     text,
  doc_ref      text,
  payload_hash text not null,                        -- SHA-256 of the payload being committed
  nonce        bigint not null default 0,
  created_at   timestamptz not null default now()
);
-- Append-only enforced by privileges (stronger than RLS): no update/delete exists.
revoke update, delete on ledger_blocks from public;

-- Optional Tier-3 anchor records (Merkle root written to a public testnet).
create table if not exists ledger_anchors (
  id           uuid primary key default gen_random_uuid(),
  merkle_root  text not null,
  from_index   bigint not null,
  to_index     bigint not null,
  chain        text not null default 'polygon-amoy',
  tx_hash      text,
  anchored_at  timestamptz,
  created_at   timestamptz default now()
);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
--    Demo posture: authenticated users read/write within their scope via
--    simple role checks sourced from their JWT app_metadata (claims synced
--    from dms_officers.role / advocates / suite_users at login).
--    Production hardening note: move classification + case-assignment checks
--    into security-definer functions for finer least-privilege.
-- ============================================================================

alter table digilocker_identities enable row level security;
alter table dms_officers          enable row level security;
alter table advocates             enable row level security;
alter table suite_users           enable row level security;
alter table audit_log             enable row level security;
alter table ledger_blocks         enable row level security;
alter table ledger_anchors        enable row level security;

-- Helper: current user's role claim (synced at login into JWT app_metadata).
create or replace function auth_role()
returns user_role language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,role}','')::user_role
$$;

-- Identity lookup is allowed to authenticated users (needed for binding checks).
create policy "auth read identities" on digilocker_identities
  for select to authenticated using (true);

create policy "auth read officers" on dms_officers
  for select to authenticated using (true);
create policy "admin write officers" on dms_officers
  for all to authenticated using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

create policy "auth read advocates" on advocates
  for select to authenticated using (true);
create policy "admin write advocates" on advocates
  for all to authenticated using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

create policy "self read suite users" on suite_users
  for select to authenticated using (true);
create policy "admin write suite users" on suite_users
  for all to authenticated using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

-- Cases: all authenticated staff can read; writes limited to admins/IO/legal.
  for select to authenticated using (true);
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','legal_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','legal_officer'));

-- Documents: authenticated read (production: add classification <= clearance);
-- writes for staff roles.
  for select to authenticated using (true);
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'));

  for select to authenticated using (true);
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'));

  for select to authenticated using (true);
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'));

  for select to authenticated using (true);
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'));

  for select to authenticated using (true);
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','legal_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','legal_officer'));

-- Audit: everyone authenticated may INSERT and SELECT; nobody may update/delete.
create policy "auth insert audit" on audit_log
  for insert to authenticated with check (true);
create policy "auth read audit" on audit_log
  for select to authenticated using (true);

-- Ledger: authenticated may INSERT blocks and SELECT; nobody may update/delete.
create policy "auth insert ledger" on ledger_blocks
  for insert to authenticated with check (true);
create policy "auth read ledger" on ledger_blocks
  for select to authenticated using (true);

create policy "auth read anchors" on ledger_anchors
  for select to authenticated using (true);
create policy "system write anchors" on ledger_anchors
  for insert to authenticated with check (true);

-- ============================================================================
-- 6. SEED — demo identity bindings (ONLY demo data; credentials sheet is
--    docs/demo-credentials.md; nothing renders in the UI)
-- ============================================================================

insert into digilocker_identities (phone, digilocker_ref, full_name, dob) values
  ('919876500001', 'DL-2231-8845-01', 'Rajesh Kumar Sharma', '1985-03-14'),
  ('919876500002', 'DL-2231-8845-02', 'Dr. Rohan Iyer',      '1979-11-02'),
  ('919876500003', 'DL-2231-8845-03', 'Anita Desai',         '1990-07-21'),
  ('919876500004', 'DL-2231-8845-04', 'Vikram Rao',          '1988-01-30'),
  ('919876500005', 'DL-2231-8845-05', 'Sneha Kulkarni',      '1995-09-12'),
  ('919876500006', 'DL-2231-8845-06', 'Adv. Meera Bhatt',    '1987-05-19'),
  ('919876500007', 'DL-2231-8845-07', 'Karan Malhotra',      '1992-02-08')
on conflict (phone) do nothing;

insert into dms_officers (unique_id, phone, role, full_name, department, unit, police_station, jurisdiction, clearance, badge_no, rank, joined_on) values
  ('IO-2026-0142', '919876500001', 'investigating_officer', 'Rajesh Kumar Sharma', 'Jaipur Police', 'Crime Branch', 'Sardarpura PS', 'Rajasthan', 'RESTRICTED', 'RJ-44821', 'Sub-Inspector', '2016-06-15'),
  ('FO-2026-0451', '919876500002', 'forensic_officer',      'Dr. Rohan Iyer',      'Forensic Science Laboratory', 'DNA & Digital Division', null, 'National', 'RESTRICTED', 'FSL-2210', 'Senior Scientific Officer', '2012-01-09'),
  ('CR-2026-0087', '919876500003', 'court_registrar',       'Anita Desai',         'Sessions Court Jaipur', 'Registry', null, 'Rajasthan', 'CONFIDENTIAL', null, 'Senior Registrar', '2014-08-01'),
  ('LO-2026-0219', '919876500004', 'legal_officer',         'Vikram Rao',          'Public Prosecutor Office', 'Trial Division', null, 'Rajasthan', 'CONFIDENTIAL', null, 'Additional Public Prosecutor', '2015-03-20'),
  ('RC-2026-0104', '919876500005', 'records_compliance',    'Sneha Kulkarni',      'State Records & Compliance Cell', 'Audit Wing', null, 'National', 'INTERNAL', null, 'Compliance Officer', '2018-11-11'),
  ('SA-2026-0001', '919876500006', 'super_admin',           'Adv. Meera Bhatt',    'NIC Platform Administration', 'Platform Ops', null, 'National', 'HIGHLY_RESTRICTED_DOC', 'SA-001', 'System Administrator', '2010-04-05')
on conflict (unique_id) do nothing;

insert into advocates (bar_enrollment_id, phone, full_name, state_bar_council, enrollment_year, practice_areas, cop_verified) values
  ('RAJ/1823/2019', '919876500004', 'Vikram Rao',       'Bar Council of Rajasthan', 2019, ARRAY['Criminal','Property'], true),
  ('DEL/0917/2016', '919876500007', 'Karan Malhotra',   'Bar Council of Delhi',     2016, ARRAY['Cyber','Corporate'],   true)
on conflict (bar_enrollment_id) do nothing;

insert into suite_users (phone, suite_role, full_name, city, state) values
  ('919876500001', 'citizen', 'Rajesh Kumar Sharma', 'Jaipur',  'Rajasthan'),
  ('919876500005', 'citizen', 'Sneha Kulkarni',      'Pune',    'Maharashtra'),
  ('919876500007', 'student', 'Karan Malhotra',      'New Delhi','Delhi')
on conflict (phone) do nothing;

-- NOTE: demo case/document/evidence rows now live in schema-v2.sql, which owns
-- those tables. Run schema-v2.sql first, then this file.



-- Genesis ledger block (prev_hash = 64 zeros).
insert into ledger_blocks (index, block_hash, prev_hash, action, actor, actor_role, case_ref, doc_ref, payload_hash, nonce) values
  (0,
   encode(digest('SUR YA|GENESIS|0|0000000000000000000000000000000000000000000000000000000000000000','sha256'),'hex'),
   repeat('0',64), 'GENESIS', 'system', null, null, null,
   encode(digest('genesis-payload','sha256'),'hex'), 0)
on conflict (index) do nothing;
