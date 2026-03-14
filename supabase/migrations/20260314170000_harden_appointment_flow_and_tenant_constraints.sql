-- Harden scheduling, visit lifecycle, and tenant integrity for core clinical tables.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_patient_overlap'
  ) then
    alter table appointments
      add constraint appointments_no_patient_overlap
      exclude using gist (
        patient_id with =,
        tstzrange(scheduled_start, scheduled_end, '[)') with &&
      )
      where (status in ('scheduled', 'checked_in', 'in_progress'));
  end if;
end
$$;

drop policy if exists appointments_update on appointments;
drop policy if exists appointments_update_staff on appointments;
create policy appointments_update_staff on appointments
for update
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]))
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists appointments_update_patient on appointments;
create policy appointments_update_patient on appointments
for update
using (
  exists (
    select 1
    from patients
    where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
  )
  and status in ('scheduled', 'checked_in')
)
with check (
  exists (
    select 1
    from patients
    where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
  )
  and status in ('checked_in', 'cancelled')
);

create or replace function appointment_transition_is_allowed(
  previous_status appointment_status,
  next_status appointment_status,
  requester_is_staff boolean
)
returns boolean
language sql
immutable
as $$
  select case
    when previous_status = next_status then true
    when requester_is_staff then
      case previous_status
        when 'scheduled' then next_status in ('checked_in', 'in_progress', 'cancelled')
        when 'checked_in' then next_status in ('in_progress', 'cancelled')
        when 'in_progress' then next_status = 'completed'
        else false
      end
    else
      case previous_status
        when 'scheduled' then next_status in ('checked_in', 'cancelled')
        when 'checked_in' then next_status = 'cancelled'
        else false
      end
  end;
$$;

create or replace function validate_provider_availability_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_org uuid;
begin
  select organization_id
  into provider_org
  from providers
  where id = new.provider_id;

  if provider_org is null then
    raise exception 'Provider record not found for availability row.';
  end if;

  if provider_org <> new.organization_id then
    raise exception 'Availability entries must stay within the provider organization.';
  end if;

  return new;
end;
$$;

create or replace function validate_patient_owned_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_org uuid;
begin
  select organization_id
  into patient_org
  from patients
  where id = new.patient_id;

  if patient_org is null then
    raise exception 'Patient record not found for %.%', tg_table_schema, tg_table_name;
  end if;

  if patient_org <> new.organization_id then
    raise exception '%.% must stay within the patient organization.', tg_table_schema, tg_table_name;
  end if;

  return new;
end;
$$;

create or replace function validate_appointment_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_org uuid;
  provider_org uuid;
  requester_is_staff boolean;
  signed_note_exists boolean;
begin
  select organization_id
  into patient_org
  from patients
  where id = new.patient_id;

  if patient_org is null then
    raise exception 'Appointment patient record not found.';
  end if;

  select organization_id
  into provider_org
  from providers
  where id = new.provider_id;

  if provider_org is null then
    raise exception 'Appointment provider record not found.';
  end if;

  if patient_org <> new.organization_id or provider_org <> new.organization_id then
    raise exception 'Appointments must use patient and provider records from the same organization.';
  end if;

  if tg_op = 'UPDATE' then
    requester_is_staff :=
      auth.uid() is null
      or is_platform_admin()
      or has_org_role(old.organization_id, array['org_admin', 'provider']::app_role[]);

    if auth.uid() is not null and (
      new.organization_id <> old.organization_id
      or new.patient_id <> old.patient_id
      or new.provider_id <> old.provider_id
      or new.scheduled_start <> old.scheduled_start
      or new.scheduled_end <> old.scheduled_end
      or new.visit_type <> old.visit_type
      or coalesce(new.meeting_url, '') <> coalesce(old.meeting_url, '')
      or coalesce(new.reason, '') <> coalesce(old.reason, '')
      or new.created_by is distinct from old.created_by
    ) then
      raise exception 'Appointment edits other than status updates are not supported in this workflow.';
    end if;

    if not appointment_transition_is_allowed(old.status, new.status, requester_is_staff) then
      raise exception 'Invalid appointment status transition from % to %.', old.status, new.status;
    end if;

    if new.status = 'completed' and old.status <> 'completed' then
      select exists (
        select 1
        from encounters
        join clinical_notes
          on clinical_notes.encounter_id = encounters.id
        where encounters.organization_id = old.organization_id
          and encounters.appointment_id = old.id
          and clinical_notes.signed_at is not null
      )
      into signed_note_exists;

      if not signed_note_exists then
        raise exception 'A signed SOAP note is required before completing an appointment.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function sync_encounter_from_appointment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'in_progress' then
    insert into encounters (
      organization_id,
      appointment_id,
      patient_id,
      provider_id,
      status,
      started_at,
      ended_at
    )
    values (
      new.organization_id,
      new.id,
      new.patient_id,
      new.provider_id,
      'open',
      now(),
      null
    )
    on conflict (appointment_id) do update
    set
      status = 'open',
      started_at = coalesce(encounters.started_at, excluded.started_at),
      ended_at = null;
  elsif new.status in ('completed', 'cancelled') then
    update encounters
    set
      status = 'closed',
      ended_at = coalesce(encounters.ended_at, now())
    where organization_id = new.organization_id
      and appointment_id = new.id;
  end if;

  return new;
end;
$$;

create or replace function validate_encounter_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  appointment_org uuid;
  appointment_patient uuid;
  appointment_provider uuid;
  patient_org uuid;
  provider_org uuid;
begin
  select organization_id, patient_id, provider_id
  into appointment_org, appointment_patient, appointment_provider
  from appointments
  where id = new.appointment_id;

  if appointment_org is null then
    raise exception 'Encounter appointment not found.';
  end if;

  select organization_id
  into patient_org
  from patients
  where id = new.patient_id;

  select organization_id
  into provider_org
  from providers
  where id = new.provider_id;

  if patient_org is null or provider_org is null then
    raise exception 'Encounter references missing patient or provider records.';
  end if;

  if appointment_org <> new.organization_id
    or appointment_patient <> new.patient_id
    or appointment_provider <> new.provider_id
    or patient_org <> new.organization_id
    or provider_org <> new.organization_id then
    raise exception 'Encounter must stay aligned with its appointment organization, patient, and provider.';
  end if;

  return new;
end;
$$;

create or replace function validate_clinical_note_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  encounter_org uuid;
  encounter_patient uuid;
  encounter_provider uuid;
  patient_org uuid;
  provider_org uuid;
begin
  select organization_id, patient_id, provider_id
  into encounter_org, encounter_patient, encounter_provider
  from encounters
  where id = new.encounter_id;

  if encounter_org is null then
    raise exception 'Clinical note encounter not found.';
  end if;

  select organization_id
  into patient_org
  from patients
  where id = new.patient_id;

  select organization_id
  into provider_org
  from providers
  where id = new.provider_id;

  if patient_org is null or provider_org is null then
    raise exception 'Clinical note references missing patient or provider records.';
  end if;

  if encounter_org <> new.organization_id
    or encounter_patient <> new.patient_id
    or encounter_provider <> new.provider_id
    or patient_org <> new.organization_id
    or provider_org <> new.organization_id then
    raise exception 'Clinical notes must stay aligned with their encounter organization, patient, and provider.';
  end if;

  return new;
end;
$$;

drop trigger if exists provider_availability_validate_row on provider_availability;
create trigger provider_availability_validate_row
before insert or update on provider_availability
for each row
execute function validate_provider_availability_row();

drop trigger if exists patient_allergies_validate_row on patient_allergies;
create trigger patient_allergies_validate_row
before insert or update on patient_allergies
for each row
execute function validate_patient_owned_row();

drop trigger if exists patient_medications_validate_row on patient_medications;
create trigger patient_medications_validate_row
before insert or update on patient_medications
for each row
execute function validate_patient_owned_row();

drop trigger if exists consents_validate_row on consents;
create trigger consents_validate_row
before insert or update on consents
for each row
execute function validate_patient_owned_row();

drop trigger if exists appointments_validate_row on appointments;
create trigger appointments_validate_row
before insert or update on appointments
for each row
execute function validate_appointment_row();

drop trigger if exists appointments_sync_encounter_status on appointments;
create trigger appointments_sync_encounter_status
after update on appointments
for each row
execute function sync_encounter_from_appointment_status();

drop trigger if exists encounters_validate_row on encounters;
create trigger encounters_validate_row
before insert or update on encounters
for each row
execute function validate_encounter_row();

drop trigger if exists clinical_notes_validate_row on clinical_notes;
create trigger clinical_notes_validate_row
before insert or update on clinical_notes
for each row
execute function validate_clinical_note_row();
