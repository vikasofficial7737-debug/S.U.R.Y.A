-- ============================================================================
-- S.U.R.Y.A. — Schema v2 (blockchain-supabase-integration-description.md)
-- Run AFTER (or instead of) schema.sql in a fresh project.
-- Spec-exact tables, real RLS enforcement, JWT custom claims, append-only audit.
-- ============================================================================

create extension if not exists "pgcrypto";

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
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  user_id uuid references users(id) not null,
  action text not null check (action in (
    'view','upload','edit','download','share',
    'delete_request','access_grant','access_revoke'
  )),
  document_id uuid references documents(id),
  case_id uuid references cases(id),
  details text
);
revoke update, delete on audit_log from anon, authenticated;

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
create policy "dept_read_all"  on departments for select to authenticated using (true);
create policy "user_read_all"  on users     for select to authenticated using (true);
create policy "user_self_upd"  on users     for update to authenticated using (id = auth.uid());
create policy "admin_all_users" on users for all to authenticated
  using (my_role() = 'system_admin') with check (my_role() = 'system_admin');

-- cases: same-department read; officers/legal see assigned; admins all
create policy "case_read" on cases for select to authenticated using (
  department_id = my_department()
  or assigned_officer_id = auth.uid()
  or assigned_lawyer_id = auth.uid()
  or my_role() in ('compliance_officer','system_admin')
);
create policy "case_write" on cases for all to authenticated
  using (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'));

-- documents: department-scoped read, overridden by explicit grants or public
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
create policy "dept_write" on documents for all to authenticated
  using (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'));

-- document_versions inherit document visibility
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
create policy "version_write" on document_versions for all to authenticated
  using (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('investigating_officer','court_registrar','legal_officer','system_admin'));

-- access_grants: staff manage; users see their own
create policy "grant_read" on access_grants for select to authenticated using (
  granted_to_user_id = auth.uid()
  or granted_by_user_id = auth.uid()
  or my_role() in ('compliance_officer','system_admin')
);
create policy "grant_write" on access_grants for all to authenticated
  using (my_role() in ('court_registrar','legal_officer','system_admin'))
  with check (my_role() in ('court_registrar','legal_officer','system_admin'));

-- audit_log: insert own rows, read within department or by compliance/admin
create policy "audit_insert" on audit_log for insert to authenticated
  with check (user_id = auth.uid() or my_role() = 'system_admin');
create policy "audit_read" on audit_log for select to authenticated using (
  my_role() in ('compliance_officer','system_admin')
  or case_id in (select id from cases where department_id = my_department())
);

-- ============================================================================
-- Storage bucket: documents (private; access via RLS-linked storage policies)
-- ============================================================================
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "storage_dept_read" on storage.objects for select to authenticated using (
  bucket_id = 'documents' and (
    (storage.foldername(name))[1] in (select id::text from departments where id = my_department())
    or my_role() in ('compliance_officer','system_admin')
  )
);
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
