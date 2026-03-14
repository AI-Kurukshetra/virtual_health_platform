-- MVP schema for tenant-safe virtual care workflows.
-- Focused on org admin -> provider -> patient -> virtual visit -> clinical note.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('platform_admin', 'org_admin', 'provider', 'patient');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum (
      'scheduled',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'encounter_status') then
    create type encounter_status as enum ('open', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type notification_status as enum ('unread', 'read');
  end if;
end
$$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  phone text,
  global_role app_role not null default 'patient',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role app_role not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  full_name text not null,
  dob date,
  sex text,
  phone text,
  email text,
  status text not null default 'active',
  intake_completed boolean not null default false,
  intake_completed_at timestamptz,
  consent_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  specialty text,
  license_number text,
  timezone text not null default 'UTC',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table if not exists provider_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes integer not null default 30 check (slot_minutes between 15 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (provider_id, day_of_week, start_time, end_time)
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete restrict,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status appointment_status not null default 'scheduled',
  visit_type text not null default 'virtual',
  meeting_url text,
  reason text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_provider_overlap'
  ) then
    alter table appointments
      add constraint appointments_no_provider_overlap
      exclude using gist (
        provider_id with =,
        tstzrange(scheduled_start, scheduled_end, '[)') with &&
      )
      where (status in ('scheduled', 'checked_in', 'in_progress'));
  end if;
end
$$;

create table if not exists encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete restrict,
  status encounter_status not null default 'open',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clinical_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  encounter_id uuid not null unique references encounters(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete restrict,
  note_type text not null default 'soap',
  subjective text,
  objective text,
  assessment text,
  plan text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patient_allergies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  allergen text not null,
  reaction text,
  severity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patient_medications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  medication_name text not null,
  dose text,
  frequency text,
  started_on date,
  ended_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  consent_type text not null,
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  status notification_status not null default 'unread',
  target_url text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_profile_id uuid references profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_memberships_profile_org on memberships (profile_id, organization_id);
create index if not exists idx_patients_org on patients (organization_id);
create index if not exists idx_providers_org on providers (organization_id);
create index if not exists idx_appointments_org_start on appointments (organization_id, scheduled_start);
create index if not exists idx_encounters_org on encounters (organization_id);
create index if not exists idx_clinical_notes_org on clinical_notes (organization_id);
create index if not exists idx_notifications_profile on notifications (profile_id, status);
create index if not exists idx_audit_logs_org_created on audit_logs (organization_id, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger organizations_set_updated_at
before update on organizations
for each row
execute function set_updated_at();

create or replace trigger profiles_set_updated_at
before update on profiles
for each row
execute function set_updated_at();

create or replace trigger memberships_set_updated_at
before update on memberships
for each row
execute function set_updated_at();

create or replace trigger patients_set_updated_at
before update on patients
for each row
execute function set_updated_at();

create or replace trigger providers_set_updated_at
before update on providers
for each row
execute function set_updated_at();

create or replace trigger provider_availability_set_updated_at
before update on provider_availability
for each row
execute function set_updated_at();

create or replace trigger appointments_set_updated_at
before update on appointments
for each row
execute function set_updated_at();

create or replace trigger encounters_set_updated_at
before update on encounters
for each row
execute function set_updated_at();

create or replace trigger clinical_notes_set_updated_at
before update on clinical_notes
for each row
execute function set_updated_at();

create or replace trigger patient_allergies_set_updated_at
before update on patient_allergies
for each row
execute function set_updated_at();

create or replace trigger patient_medications_set_updated_at
before update on patient_medications
for each row
execute function set_updated_at();

create or replace trigger consents_set_updated_at
before update on consents
for each row
execute function set_updated_at();
