-- Invitation-based patient onboarding primitives.

create table if not exists patient_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invited_email text not null,
  invited_full_name text,
  invited_by_profile_id uuid not null references profiles(id) on delete restrict,
  invited_by_role app_role not null,
  provider_profile_id uuid references profiles(id) on delete set null,
  token_hash text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create index if not exists patient_invitations_org_email_idx
  on patient_invitations(organization_id, invited_email);

create index if not exists patient_invitations_status_expires_idx
  on patient_invitations(status, expires_at);

create table if not exists patient_provider_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  assigned_by_profile_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (organization_id, patient_id, provider_id)
);

create index if not exists patient_provider_assignments_org_patient_idx
  on patient_provider_assignments(organization_id, patient_id);

alter table patient_invitations enable row level security;
alter table patient_provider_assignments enable row level security;

drop policy if exists patient_invitations_select on patient_invitations;
create policy patient_invitations_select on patient_invitations
for select
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_invitations_insert on patient_invitations;
create policy patient_invitations_insert on patient_invitations
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_invitations_update on patient_invitations;
create policy patient_invitations_update on patient_invitations
for update
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]))
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_provider_assignments_select on patient_provider_assignments;
create policy patient_provider_assignments_select on patient_provider_assignments
for select
using (has_org_membership(organization_id));

drop policy if exists patient_provider_assignments_insert on patient_provider_assignments;
create policy patient_provider_assignments_insert on patient_provider_assignments
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

grant select, insert, update, delete on patient_invitations to authenticated;
grant select, insert, update, delete on patient_provider_assignments to authenticated;
