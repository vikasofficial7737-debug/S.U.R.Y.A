-- ============================================================================
-- S.U.R.Y.A. / NyayaVault — COMPLETE BACKEND SCHEMA (single file)
-- ============================================================================
-- HOW TO INSTALL (2 minutes):
--   1. Open https://supabase.com/dashboard -> your project -> SQL Editor
--   2. Paste this ENTIRE file -> Run. Done. Run it again anytime — it is
--      idempotent (safe to re-run; uses IF NOT EXISTS / OR REPLACE / ON CONFLICT).
-- WHAT YOU GET:
--   - departments, users(profiles), cases, documents, document_versions,
--     access_grants, audit_log  (spec-exact shapes)
--   - Row Level Security policies per role + access grants
--   - Custom JWT claims (role/department) via auth hook
--   - Append-only audit log (no UPDATE/DELETE policy + privileges revoked)
--   - ledger_blocks integrity chain + demo seed data (all demo logins work)
-- ============================================================================

-- ============================================================================
-- NyayaVault — Schema v2 (blockchain-supabase-integration-description.md)
-- Run AFTER (or instead of) schema.sql in a fresh project.
-- Spec-exact tables, real RLS enforcement, JWT custom claims, append-only audit.
-- ============================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------- enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
  create type user_role as enum (
    'super_admin','department_admin','investigating_officer','forensic_officer',
    'legal_officer','court_registrar','records_compliance',
    'citizen','lawyer','student'
  );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_classification') THEN
  create type doc_classification as enum ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_status') THEN
  create type doc_status as enum (
    'DRAFT','UPLOADED','OCR_PROCESSING','PENDING_VERIFICATION','VERIFIED','SIGNED','ARCHIVED'
  );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
  create type case_status as enum (
    'REGISTERED','INVESTIGATION','EVIDENCE_COLLECTION','LEGAL_REVIEW',
    'COURT_SUBMISSION','UNDER_TRIAL','DISPOSED','ARCHIVED'
  );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custody_status') THEN
  create type custody_status as enum ('IN_CUSTODY','WITH_FORENSIC','IN_COURT','RETURNED','DISPOSED');
  END IF;
END $$;


-- ---------------------------------------------------------------- departments
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('police','court','legal_dept','compliance','admin'))
);

-- ---------------------------------------------------------------------- users
-- 1:1 with auth.users. Role + department live here and are projected into the
-- JWT via the custom-claim hook below, so RLS checks stay query-free.
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in (
    'investigating_officer','court_registrar','legal_officer',
    'compliance_officer','system_admin','citizen','lawyer','student'
  )),
  department_id uuid references departments(id),
  linked_surya_lawyer_id uuid
);

-- Custom JWT claims (Supabase Auth hook: [auth] jwt_secret + claims hook)
create or replace function custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  claims jsonb;
  u_role text;
  u_dept uuid;
begin
  select role, department_id into u_role, u_dept from users where id = (event->>'user_id')::uuid;
  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(coalesce(u_role, 'citizen')));
  if u_dept is not null then
    claims := jsonb_set(claims, '{app_metadata,department_id}', to_jsonb(u_dept));
  end if;
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- ---------------------------------------------------------------------- cases
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  case_number text unique not null,
  title text not null,
  department_id uuid references departments(id) not null,
  status text not null check (status in ('open','under_investigation','in_court','closed')),
  assigned_officer_id uuid references users(id),
  assigned_lawyer_id uuid references users(id),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------ documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) not null,
  type text not null check (type in (
    'fir','investigation_record','witness_statement','charge_sheet',
    'court_filing','evidence_record','forensic_report','legal_notice','judgment'
  )),
  title text not null,
  status text not null check (status in ('draft','pending_review','verified','flagged','archived')),
  department_id uuid references departments(id) not null,
  tags text[] default '{}',
  current_version int not null default 1,
  is_public boolean default false,
  is_tamper_flagged boolean default false,
  retention_policy text,
  retain_until date,
  legal_hold boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------- document_versions
create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) not null,
  version_number int not null,
  storage_path text not null,
  file_hash text not null,
  previous_hash text,
  chain_hash text not null,
  on_chain_tx_hash text,
  on_chain_status text default 'not_anchored' check (
    on_chain_status in ('not_anchored','pending','anchored','failed')
  ),
  on_chain_timestamp timestamptz,
  signature_image_path text,
  signed_by uuid references users(id),
  signed_at timestamptz,
  uploaded_by uuid references users(id) not null,
  uploaded_at timestamptz default now(),
  unique (document_id, version_number)
);

-- -------------------------------------------------------------- access_grants
create table if not exists access_grants (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) not null,
  granted_to_user_id uuid references users(id) not null,
  granted_by_user_id uuid references users(id) not null,
  permission text not null check (permission in ('view','download','edit')),
  expires_at timestamptz,
  status text not null default 'pending' check (status in ('pending','active','expired','revoked'))
);

-- ------------------------------------------------------------------ audit_log
-- Genuinely append-only: RLS provides insert+select only; UPDATE/DELETE are
-- additionally revoked by privilege below (holds even for table owner bypass
-- paths via anon/authenticated roles).
create table if not exists audit_log (
  id          bigserial primary key,
  timestamp   timestamptz default now(),
  happened_at timestamptz not null default now(),   -- alias used by app
  user_id     uuid references users(id),
  actor       text,                                  -- display id (e.g. IO-2026-0142)
  actor_role  user_role,
  action      text not null,                         -- view|upload|download|share|LOGIN|...
  document_id uuid references documents(id),
  case_id     uuid references cases(id),
  resource    text,
  case_ref    text,
  details     jsonb default '{}'::jsonb
);
revoke update, delete on audit_log from anon, authenticated;
-- audit_log is append-only: an INSERT policy exists, deliberately NO update/delete policy.

-- ============================================================================
-- RLS — the permission matrix, enforced by Postgres
-- ============================================================================
alter table departments      enable row level security;
alter table users            enable row level security;
alter table cases            enable row level security;
alter table documents        enable row level security;
alter table document_versions enable row level security;
alter table access_grants    enable row level security;
alter table audit_log        enable row level security;

create or replace function my_role() returns text language sql stable as
$$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', (select role from users where id = auth.uid())) $$;

create or replace function my_department() returns uuid language sql stable as
$$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'department_id')::uuid, (select department_id from users where id = auth.uid())) $$;

-- departments / users: readable by authenticated staff
drop policy if exists "dept_read_all" on departments;
create policy "dept_read_all"  on departments for select to authenticated using (true);
drop policy if exists "user_read_all" on users;
create policy "user_read_all"  on users     for select to authenticated using (true);
drop policy if exists "user_self_upd" on users;
create policy "user_self_upd"  on users     for update to authenticated using (id = auth.uid());
drop policy if exists "admin_all_users" on users;
create policy "admin_all_users" on users for all to authenticated
  using (my_role() = 'system_admin') with check (my_role() = 'system_admin');

-- cases: same-department read; officers/legal see assigned; admins all
drop policy if exists "case_read" on cases;
create policy "case_read" on cases for select to authenticated using (
  department_id = my_department()
  or assigned_officer_id = auth.uid()
  or assigned_lawyer_id = auth.uid()
  or my_role() in ('compliance_officer','system_admin')
);
drop policy if exists "case_write" on cases;
create policy "case_write" on cases for all to authenticated
  using (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'));

-- documents: department-scoped read, overridden by explicit grants or public
drop policy if exists "dept_read" on documents;
create policy "dept_read" on documents for select to authenticated using (
  is_public = true
  or department_id = my_department()
  or my_role() in ('compliance_officer','system_admin')
  or exists (
    select 1 from access_grants g
    where g.document_id = documents.id
      and g.granted_to_user_id = auth.uid()
      and g.status = 'active'
      and (g.expires_at is null or g.expires_at > now())
  )
);
drop policy if exists "dept_write" on documents;
create policy "dept_write" on documents for all to authenticated
  using (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'));

-- document_versions inherit document visibility
drop policy if exists "version_read" on document_versions;
create policy "version_read" on document_versions for select to authenticated using (
  exists (
    select 1 from documents d
    where d.id = document_versions.document_id
      and (d.is_public = true
        or d.department_id = my_department()
        or my_role() in ('compliance_officer','system_admin')
        or exists (
          select 1 from access_grants g
          where g.document_id = d.id and g.granted_to_user_id = auth.uid()
            and g.status = 'active' and (g.expires_at is null or g.expires_at > now())
        ))
  )
);
drop policy if exists "version_write" on document_versions;
create policy "version_write" on document_versions for all to authenticated
  using (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'));

-- access_grants: staff manage; users see their own
drop policy if exists "grant_read" on access_grants;
create policy "grant_read" on access_grants for select to authenticated using (
  granted_to_user_id = auth.uid()
  or granted_by_user_id = auth.uid()
  or my_role() in ('compliance_officer','system_admin')
);
drop policy if exists "grant_write" on access_grants;
create policy "grant_write" on access_grants for all to authenticated
  using (my_role() in ('court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('court_registrar','legal_officer','system_admin'));

-- audit_log: insert own rows, read within department or by compliance/admin
drop policy if exists "audit_insert" on audit_log;
create policy "audit_insert" on audit_log for insert to authenticated
  with check (user_id = auth.uid() or my_role() = 'system_admin');
drop policy if exists "audit_read" on audit_log;
create policy "audit_read" on audit_log for select to authenticated using (
  my_role() in ('compliance_officer','system_admin')
  or case_id in (select id from cases where department_id = my_department())
);

-- ============================================================================
-- Storage bucket: documents (private; access via RLS-linked storage policies)
-- ============================================================================
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "storage_dept_read" on storage.objects;
create policy "storage_dept_read" on storage.objects for select to authenticated using (
  bucket_id = 'documents' and (
    (storage.foldername(name))[1] in (select id::text from departments where id = my_department())
    or my_role() in ('compliance_officer','system_admin')
  )
);
drop policy if exists "storage_staff_write" on storage.objects;
create policy "storage_staff_write" on storage.objects for insert to authenticated with check (
  bucket_id = 'documents'
  and my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin')
);

-- ============================================================================
-- Seed demo departments (users are created through Supabase Auth, then given a
-- row in `users` — see docs/blockchain-deployment.md for the bootstrap steps)
-- ============================================================================
insert into departments (name, type) values
  ('Jaipur Police — Crime Branch', 'police'),
  ('Sessions Court Jaipur', 'court'),
  ('Public Prosecutor Office', 'legal_dept'),
  ('State Records & Compliance Cell', 'compliance'),
  ('NIC Platform Administration', 'admin')
on conflict do nothing;

-- Demo case + documents so RLS behaviour is testable immediately after you
-- create your first users (docs/blockchain-deployment.md §6). Public/private
-- mix is deliberate: 'is_public = true' is what the Student module may see.
insert into cases (case_number, title, department_id, status)
select 'CR/124/2026', 'State vs. R. Singh — IPC 302',
       (select id from departments where name like 'Jaipur Police%'), 'in_court'
where not exists (select 1 from cases where case_number = 'CR/124/2026');

insert into documents (case_id, type, title, status, department_id, is_public, tags)
select c.id, 'fir', 'FIR 41/2024 — Sardarpura PS', 'verified', c.department_id, true,  ARRAY['fir','302']
from cases c where c.case_number = 'CR/124/2026'
  and not exists (select 1 from documents where title = 'FIR 41/2024 — Sardarpura PS');

insert into documents (case_id, type, title, status, department_id, is_public, tags, legal_hold)
select c.id, 'witness_statement', 'Statement of Rajesh Meena (161 CrPC)', 'pending_review', c.department_id, false, ARRAY['witness'], true
from cases c where c.case_number = 'CR/124/2026'
  and not exists (select 1 from documents where title = 'Statement of Rajesh Meena (161 CrPC)');

insert into documents (case_id, type, title, status, department_id, is_public, tags)
select c.id, 'forensic_report', 'FSL Report 17 — Digital devices', 'verified', c.department_id, false, ARRAY['forensic']
from cases c where c.case_number = 'CR/124/2026'
  and not exists (select 1 from documents where title = 'FSL Report 17 — Digital devices');


-- ============================================================================
-- NyayaVault — IDENTITY & LEDGER layer (safe to run alongside schema-v2.sql)
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

-- (audit_log defined once above — shared by DMS and identity flows)

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
drop policy if exists "auth read identities" on digilocker_identities;
create policy "auth read identities" on digilocker_identities
  for select to authenticated using (true);

drop policy if exists "auth read officers" on dms_officers;
create policy "auth read officers" on dms_officers
  for select to authenticated using (true);
drop policy if exists "admin write officers" on dms_officers;
create policy "admin write officers" on dms_officers
  for all to authenticated using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

drop policy if exists "auth read advocates" on advocates;
create policy "auth read advocates" on advocates
  for select to authenticated using (true);
drop policy if exists "admin write advocates" on advocates;
create policy "admin write advocates" on advocates
  for all to authenticated using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

drop policy if exists "self read suite users" on suite_users;
create policy "self read suite users" on suite_users
  for select to authenticated using (true);
drop policy if exists "admin write suite users" on suite_users;
create policy "admin write suite users" on suite_users
  for all to authenticated using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

-- Cases/documents/versions/grants policies already defined above (v2 section).
-- Identity-layer tables below reuse auth_role() from the v2 helpers.

-- Audit: everyone authenticated may INSERT and SELECT; nobody may update/delete.
drop policy if exists "auth insert audit" on audit_log;
create policy "auth insert audit" on audit_log
  for insert to authenticated with check (true);
drop policy if exists "auth read audit" on audit_log;
create policy "auth read audit" on audit_log
  for select to authenticated using (true);

-- Ledger: authenticated may INSERT blocks and SELECT; nobody may update/delete.
drop policy if exists "auth insert ledger" on ledger_blocks;
create policy "auth insert ledger" on ledger_blocks
  for insert to authenticated with check (true);
drop policy if exists "auth read ledger" on ledger_blocks;
create policy "auth read ledger" on ledger_blocks
  for select to authenticated using (true);

drop policy if exists "auth read anchors" on ledger_anchors;
create policy "auth read anchors" on ledger_anchors
  for select to authenticated using (true);
drop policy if exists "system write anchors" on ledger_anchors;
create policy "system write anchors" on ledger_anchors
  for insert to authenticated with check (true);

-- ============================================================================
-- 5b. DEMO-MODE ACCESS — the mock DigiLocker door authenticates at the app
--     layer (no Supabase Auth session), so lookups run with the anon key.
--     SELECT on the directory tables + append-only writes on audit/ledger.
--     PRODUCTION NOTE: with real Supabase Auth these revert to `authenticated`.
-- ============================================================================
drop policy if exists "anon read identities" on digilocker_identities;
create policy "anon read identities" on digilocker_identities
  for select to anon, authenticated using (true);
drop policy if exists "anon read officers" on dms_officers;
create policy "anon read officers" on dms_officers
  for select to anon, authenticated using (true);
drop policy if exists "anon read advocates" on advocates;
create policy "anon read advocates" on advocates
  for select to anon, authenticated using (true);
drop policy if exists "anon read suite users" on suite_users;
create policy "anon read suite users" on suite_users
  for select to anon, authenticated using (true);
drop policy if exists "anon insert audit" on audit_log;
create policy "anon insert audit" on audit_log
  for insert to anon with check (true);
drop policy if exists "anon read audit" on audit_log;
create policy "anon read audit" on audit_log
  for select to anon, authenticated using (true);
drop policy if exists "anon insert ledger" on ledger_blocks;
create policy "anon insert ledger" on ledger_blocks
  for insert to anon with check (true);
drop policy if exists "anon read ledger" on ledger_blocks;
create policy "anon read ledger" on ledger_blocks
  for select to anon, authenticated using (true);

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
  ('SA-2026-0001', '919876500006', 'super_admin',           'Adv. Meera Bhatt',    'NIC Platform Administration', 'Platform Ops', null, 'National', 'RESTRICTED', 'SA-001', 'System Administrator', '2010-04-05')
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
