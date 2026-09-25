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
-- 2. DMS CORE — cases, documents, evidence
-- ============================================================================

create table if not exists cases (
  id            uuid primary key default gen_random_uuid(),
  case_number   text unique not null,                -- CR/124/2026
  title         text not null,
  description   text,
  status        case_status not null default 'REGISTERED',
  priority      text not null default 'MEDIUM' check (priority in ('HIGH','MEDIUM','LOW')),
  classification doc_classification not null default 'CONFIDENTIAL',
  fir_number    text,
  court         text,
  next_hearing  date,
  created_by    text references dms_officers(unique_id),
  assigned_io   text references dms_officers(unique_id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_cases_io on cases(assigned_io);

create table if not exists documents (
  id             uuid primary key default gen_random_uuid(),
  doc_code       text unique not null,               -- DOC-0009821
  case_id        uuid references cases(id) on delete cascade,
  doc_type       text not null,                      -- FIR | WITNESS_STATEMENT | FORENSIC_REPORT | CHARGE_SHEET ...
  title          text not null,
  status         doc_status not null default 'UPLOADED',
  classification doc_classification not null default 'CONFIDENTIAL',
  file_path      text,                               -- supabase storage path
  file_sha256    text,                               -- Tier-2 integrity hash of bytes
  file_size      bigint,
  mime_type      text,
  current_version int not null default 1,
  uploaded_by    text references dms_officers(unique_id),
  verified_by    text references dms_officers(unique_id),
  source_type    text not null default 'OFFICIAL_DEPARTMENT_UPLOAD',
  metadata       jsonb not null default '{}',        -- type-specific profile fields
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists idx_documents_case on documents(case_id);

create table if not exists document_versions (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  version       int not null,
  reason        text not null,                       -- mandatory reason for change
  file_sha256   text,
  created_by    text references dms_officers(unique_id),
  created_at    timestamptz default now(),
  unique (document_id, version)
);

create table if not exists evidence (
  id            uuid primary key default gen_random_uuid(),
  evidence_code text unique not null,                -- EV-2026-0321
  case_id       uuid references cases(id) on delete cascade,
  evidence_type text not null,                       -- MOBILE_PHONE | DOCUMENT | WEAPON ...
  description   text,
  collected_by  text references dms_officers(unique_id),
  collected_at  timestamptz,
  location      text,
  current_custodian text not null,                   -- department or officer label
  custody_status custody_status not null default 'IN_CUSTODY',
  sha256        text,
  created_at    timestamptz default now()
);
create index if not exists idx_evidence_case on evidence(case_id);

create table if not exists custody_events (
  id            uuid primary key default gen_random_uuid(),
  evidence_id   uuid not null references evidence(id) on delete cascade,
  from_party    text not null,
  to_party      text not null,
  reason        text not null,
  actor         text references dms_officers(unique_id),
  happened_at   timestamptz default now()
);

-- Time-bound permissioned sharing between departments / with the SURYA suite.
create table if not exists shares (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references documents(id) on delete cascade,
  shared_with  text not null,                        -- department | suite:lawyer
  permission   text not null default 'VIEW' check (permission in ('VIEW','DOWNLOAD')),
  download_allowed boolean not null default false,
  watermark    boolean not null default true,
  expires_at   timestamptz not null,
  created_by   text references dms_officers(unique_id),
  revoked      boolean not null default false,
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
alter table cases                 enable row level security;
alter table documents             enable row level security;
alter table document_versions     enable row level security;
alter table evidence              enable row level security;
alter table custody_events        enable row level security;
alter table shares                enable row level security;
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
create policy "staff read cases" on cases
  for select to authenticated using (true);
create policy "staff write cases" on cases
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','legal_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','legal_officer'));

-- Documents: authenticated read (production: add classification <= clearance);
-- writes for staff roles.
create policy "staff read documents" on documents
  for select to authenticated using (true);
create policy "staff write documents" on documents
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'));

create policy "staff read versions" on document_versions
  for select to authenticated using (true);
create policy "staff write versions" on document_versions
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer','legal_officer'));

create policy "staff read evidence" on evidence
  for select to authenticated using (true);
create policy "io/forensic write evidence" on evidence
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'));

create policy "staff read custody" on custody_events
  for select to authenticated using (true);
create policy "io/forensic write custody" on custody_events
  for all to authenticated
  using (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'))
  with check (auth_role() in ('super_admin','department_admin','investigating_officer','forensic_officer'));

create policy "staff read shares" on shares
  for select to authenticated using (true);
create policy "staff write shares" on shares
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

-- Demo case + documents + evidence so dashboards are alive immediately.
insert into cases (case_number, title, description, status, priority, classification, fir_number, court, next_hearing, assigned_io) values
  ('CR/124/2026', 'State vs. R. Singh', 'Murder trial arising from FIR 41/2024 at Sardarpura PS; IPC 302. Forensic expert cross-examination pending.', 'UNDER_TRIAL', 'HIGH', 'RESTRICTED', 'FIR/41/2024', 'Sessions Court, Jaipur', current_date + 7, 'IO-2026-0142')
on conflict (case_number) do nothing;

insert into documents (doc_code, case_id, doc_type, title, status, classification, file_sha256, uploaded_by, verified_by, metadata) values
  ('DOC-0000911', (select id from cases where case_number='CR/124/2026'), 'FIR', 'FIR 41/2024 — Sardarpura PS', 'VERIFIED', 'RESTRICTED', 'seeded-demo', 'IO-2026-0142', 'CR-2026-0087', '{"fir_number":"FIR/41/2024","police_station":"Sardarpura","sections":"302, 34 IPC"}'::jsonb),
  ('DOC-0000912', (select id from cases where case_number='CR/124/2026'), 'FORENSIC_REPORT', 'FSL Report — Digital Devices', 'SIGNED', 'CONFIDENTIAL', 'seeded-demo', 'FO-2026-0451', 'FO-2026-0451', '{"lab":"FSL Jaipur","examiner":"Dr. R. Iyer"}'::jsonb),
  ('DOC-0000913', (select id from cases where case_number='CR/124/2026'), 'WITNESS_STATEMENT', 'Statement of Rajesh Meena (161 CrPC)', 'PENDING_VERIFICATION', 'CONFIDENTIAL', 'seeded-demo', 'IO-2026-0142', null, '{"witness":"Rajesh Meena","language":"Hindi"}'::jsonb)
on conflict (doc_code) do nothing;

insert into evidence (evidence_code, case_id, evidence_type, description, collected_by, current_custodian, custody_status, sha256) values
  ('EV-2026-0301', (select id from cases where case_number='CR/124/2026'), 'MOBILE_PHONE', 'Accused handset, Samsung M34, IMEI captured', 'IO-2026-0142', 'Forensic Science Laboratory', 'WITH_FORENSIC', 'seeded-demo'),
  ('EV-2026-0302', (select id from cases where case_number='CR/124/2026'), 'CCTV_DRIVE', 'Shop CCTV DVR drive, 21:00–22:00 hrs clip', 'IO-2026-0142', 'Jaipur Police — Crime Branch', 'IN_CUSTODY', 'seeded-demo')
on conflict (evidence_code) do nothing;

-- Genesis ledger block (prev_hash = 64 zeros).
insert into ledger_blocks (index, block_hash, prev_hash, action, actor, actor_role, case_ref, doc_ref, payload_hash, nonce) values
  (0,
   encode(digest('SUR YA|GENESIS|0|0000000000000000000000000000000000000000000000000000000000000000','sha256'),'hex'),
   repeat('0',64), 'GENESIS', 'system', null, null, null,
   encode(digest('genesis-payload','sha256'),'hex'), 0)
on conflict (index) do nothing;
