-- Deterministic demo seed for remote browser testing.
-- Password for all seeded users: ChangeMe123!

create extension if not exists pgcrypto;

insert into organizations (id, name, slug, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Sunrise Virtual Clinic', 'sunrise-virtual-clinic', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Harbor Telehealth Group', 'harbor-telehealth-group', 'active')
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  updated_at = now();

delete from auth.identities
where user_id in (
  select id
  from auth.users
  where email in (
    'admin@virtualhealth.local',
    'provider@virtualhealth.local',
    'patient@virtualhealth.local',
    'admin2@virtualhealth.local',
    'provider2@virtualhealth.local',
    'patient2@virtualhealth.local'
  )
  union
  select unnest(
    array[
      '44444444-4444-4444-4444-444444444441'::uuid,
      '44444444-4444-4444-4444-444444444442'::uuid,
      '44444444-4444-4444-4444-444444444443'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid,
      '44444444-4444-4444-4444-444444444445'::uuid,
      '44444444-4444-4444-4444-444444444446'::uuid
    ]
  )
);

delete from auth.users
where email in (
    'admin@virtualhealth.local',
    'provider@virtualhealth.local',
    'patient@virtualhealth.local',
    'admin2@virtualhealth.local',
    'provider2@virtualhealth.local',
    'patient2@virtualhealth.local'
  )
   or id in (
    '44444444-4444-4444-4444-444444444441',
    '44444444-4444-4444-4444-444444444442',
    '44444444-4444-4444-4444-444444444443',
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444445',
    '44444444-4444-4444-4444-444444444446'
  );

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  seed_users.id,
  'authenticated',
  'authenticated',
  seed_users.email,
  extensions.crypt('ChangeMe123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', seed_users.full_name, 'role', seed_users.global_role),
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    (
      '44444444-4444-4444-4444-444444444441'::uuid,
      'admin@virtualhealth.local',
      'Avery Admin',
      'org_admin'
    ),
    (
      '44444444-4444-4444-4444-444444444442'::uuid,
      'provider@virtualhealth.local',
      'Priya Provider',
      'provider'
    ),
    (
      '44444444-4444-4444-4444-444444444443'::uuid,
      'patient@virtualhealth.local',
      'Paula Patient',
      'patient'
    ),
    (
      '44444444-4444-4444-4444-444444444444'::uuid,
      'admin2@virtualhealth.local',
      'Hank Harbor Admin',
      'org_admin'
    ),
    (
      '44444444-4444-4444-4444-444444444445'::uuid,
      'provider2@virtualhealth.local',
      'Holly Harbor Provider',
      'provider'
    ),
    (
      '44444444-4444-4444-4444-444444444446'::uuid,
      'patient2@virtualhealth.local',
      'Peter Harbor Patient',
      'patient'
    )
) as seed_users(id, email, full_name, global_role);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  seed_users.id,
  jsonb_build_object(
    'sub',
    seed_users.id::text,
    'email',
    seed_users.email,
    'email_verified',
    true
  ),
  'email',
  seed_users.id::text,
  now(),
  now(),
  now()
from (
  values
    (
      '44444444-4444-4444-4444-444444444441'::uuid,
      'admin@virtualhealth.local'
    ),
    (
      '44444444-4444-4444-4444-444444444442'::uuid,
      'provider@virtualhealth.local'
    ),
    (
      '44444444-4444-4444-4444-444444444443'::uuid,
      'patient@virtualhealth.local'
    ),
    (
      '44444444-4444-4444-4444-444444444444'::uuid,
      'admin2@virtualhealth.local'
    ),
    (
      '44444444-4444-4444-4444-444444444445'::uuid,
      'provider2@virtualhealth.local'
    ),
    (
      '44444444-4444-4444-4444-444444444446'::uuid,
      'patient2@virtualhealth.local'
    )
) as seed_users(id, email)
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

insert into profiles (id, full_name, email, global_role)
select
  seed_users.id,
  seed_users.full_name,
  seed_users.email,
  seed_users.global_role::app_role
from (
  values
    (
      '44444444-4444-4444-4444-444444444441'::uuid,
      'Avery Admin',
      'admin@virtualhealth.local',
      'org_admin'
    ),
    (
      '44444444-4444-4444-4444-444444444442'::uuid,
      'Priya Provider',
      'provider@virtualhealth.local',
      'provider'
    ),
    (
      '44444444-4444-4444-4444-444444444443'::uuid,
      'Paula Patient',
      'patient@virtualhealth.local',
      'patient'
    ),
    (
      '44444444-4444-4444-4444-444444444444'::uuid,
      'Hank Harbor Admin',
      'admin2@virtualhealth.local',
      'org_admin'
    ),
    (
      '44444444-4444-4444-4444-444444444445'::uuid,
      'Holly Harbor Provider',
      'provider2@virtualhealth.local',
      'provider'
    ),
    (
      '44444444-4444-4444-4444-444444444446'::uuid,
      'Peter Harbor Patient',
      'patient2@virtualhealth.local',
      'patient'
    )
) as seed_users(id, full_name, email, global_role)
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  global_role = excluded.global_role,
  updated_at = now();

insert into memberships (organization_id, profile_id, role, status)
values
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', 'org_admin', 'active'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444442', 'provider', 'active'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444443', 'patient', 'active'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'org_admin', 'active'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444445', 'provider', 'active'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444446', 'patient', 'active')
on conflict (organization_id, profile_id) do update
set
  role = excluded.role,
  status = excluded.status,
  updated_at = now();

insert into providers (id, organization_id, profile_id, specialty, license_number, timezone, bio)
values
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    'Family Medicine',
    'LIC-1001',
    'America/New_York',
    'Virtual primary care for adults, follow-ups, and same-day triage.'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444445',
    'Behavioral Health',
    'LIC-2001',
    'America/Chicago',
    'Teletherapy, behavioral wellness check-ins, and intake sessions.'
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  profile_id = excluded.profile_id,
  specialty = excluded.specialty,
  license_number = excluded.license_number,
  timezone = excluded.timezone,
  bio = excluded.bio,
  updated_at = now();

insert into patients (
  id,
  organization_id,
  profile_id,
  full_name,
  dob,
  sex,
  phone,
  email,
  intake_completed,
  intake_completed_at,
  consent_accepted_at
)
values
  (
    '66666666-6666-6666-6666-666666666661',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444443',
    'Paula Patient',
    '1993-08-15',
    'female',
    '+1-555-000-1003',
    'patient@virtualhealth.local',
    true,
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444446',
    'Peter Harbor Patient',
    '1989-02-21',
    'male',
    '+1-555-000-2003',
    'patient2@virtualhealth.local',
    true,
    now() - interval '4 days',
    now() - interval '4 days'
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Taylor Intake',
    '2001-11-03',
    'other',
    '+1-555-000-1099',
    'taylor.intake@virtualhealth.local',
    false,
    null,
    null
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  profile_id = excluded.profile_id,
  full_name = excluded.full_name,
  dob = excluded.dob,
  sex = excluded.sex,
  phone = excluded.phone,
  email = excluded.email,
  intake_completed = excluded.intake_completed,
  intake_completed_at = excluded.intake_completed_at,
  consent_accepted_at = excluded.consent_accepted_at,
  updated_at = now();

insert into provider_availability (
  organization_id,
  provider_id,
  day_of_week,
  start_time,
  end_time,
  slot_minutes,
  is_active
)
values
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 1, '09:00', '12:00', 30, true),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 3, '13:00', '17:00', 30, true),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 5, '10:00', '12:00', 30, true),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', 2, '10:00', '14:00', 30, true),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', 4, '09:00', '12:00', 30, true)
on conflict (provider_id, day_of_week, start_time, end_time) do update
set
  slot_minutes = excluded.slot_minutes,
  is_active = excluded.is_active,
  updated_at = now();

insert into appointments (
  id,
  organization_id,
  patient_id,
  provider_id,
  scheduled_start,
  scheduled_end,
  status,
  visit_type,
  meeting_url,
  reason,
  created_by
)
values
  (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    date_trunc('day', now() + interval '1 day') + interval '10 hours',
    date_trunc('day', now() + interval '1 day') + interval '10 hours 30 minutes',
    'scheduled',
    'virtual',
    'https://meet.jit.si/sunrise-follow-up-1',
    'Follow-up consultation',
    '44444444-4444-4444-4444-444444444443'
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    date_trunc('day', now() - interval '2 day') + interval '14 hours',
    date_trunc('day', now() - interval '2 day') + interval '14 hours 30 minutes',
    'completed',
    'virtual',
    'https://meet.jit.si/sunrise-med-review',
    'Medication review',
    '44444444-4444-4444-4444-444444444442'
  ),
  (
    '77777777-7777-7777-7777-777777777773',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    date_trunc('day', now() + interval '3 day') + interval '16 hours',
    date_trunc('day', now() + interval '3 day') + interval '16 hours 30 minutes',
    'scheduled',
    'virtual',
    'https://meet.jit.si/sunrise-routine-checkin',
    'Routine check-in',
    '44444444-4444-4444-4444-444444444443'
  ),
  (
    '77777777-7777-7777-7777-777777777774',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666662',
    '55555555-5555-5555-5555-555555555552',
    date_trunc('day', now() + interval '2 day') + interval '11 hours',
    date_trunc('day', now() + interval '2 day') + interval '11 hours 30 minutes',
    'scheduled',
    'virtual',
    'https://meet.jit.si/harbor-intake-visit',
    'Therapy intake',
    '44444444-4444-4444-4444-444444444446'
  ),
  (
    '77777777-7777-7777-7777-777777777775',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    date_trunc('hour', now() + interval '2 hours'),
    date_trunc('hour', now() + interval '2 hours') + interval '30 minutes',
    'checked_in',
    'virtual',
    'https://meet.jit.si/sunrise-active-visit',
    'Same-day symptom triage',
    '44444444-4444-4444-4444-444444444443'
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  patient_id = excluded.patient_id,
  provider_id = excluded.provider_id,
  scheduled_start = excluded.scheduled_start,
  scheduled_end = excluded.scheduled_end,
  status = excluded.status,
  visit_type = excluded.visit_type,
  meeting_url = excluded.meeting_url,
  reason = excluded.reason,
  created_by = excluded.created_by,
  updated_at = now();

insert into encounters (
  id,
  organization_id,
  appointment_id,
  patient_id,
  provider_id,
  status,
  started_at,
  ended_at
)
values
  (
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777772',
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    'closed',
    now() - interval '2 day' + interval '14 hours',
    now() - interval '2 day' + interval '14 hours 25 minutes'
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777775',
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    'open',
    now() - interval '10 minutes',
    null
  )
on conflict (appointment_id) do update
set
  patient_id = excluded.patient_id,
  provider_id = excluded.provider_id,
  status = excluded.status,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  updated_at = now();

insert into clinical_notes (
  id,
  organization_id,
  encounter_id,
  patient_id,
  provider_id,
  note_type,
  subjective,
  objective,
  assessment,
  plan,
  signed_at
)
values
  (
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888881',
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    'soap',
    'Patient reports improved sleep and no dizziness.',
    'Vitals stable during video review. No acute distress.',
    'Hypertension is stable on the current regimen.',
    'Continue current medication and follow up in 4 weeks.',
    now() - interval '2 day' + interval '14 hours 28 minutes'
  )
on conflict (encounter_id) do update
set
  patient_id = excluded.patient_id,
  provider_id = excluded.provider_id,
  note_type = excluded.note_type,
  subjective = excluded.subjective,
  objective = excluded.objective,
  assessment = excluded.assessment,
  plan = excluded.plan,
  signed_at = excluded.signed_at,
  updated_at = now();

insert into patient_allergies (id, organization_id, patient_id, allergen, reaction, severity)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    'Penicillin',
    'Rash',
    'moderate'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    'Latex',
    'Itching',
    'mild'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666662',
    'Peanuts',
    'Swelling',
    'severe'
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  patient_id = excluded.patient_id,
  allergen = excluded.allergen,
  reaction = excluded.reaction,
  severity = excluded.severity,
  updated_at = now();

insert into patient_medications (
  id,
  organization_id,
  patient_id,
  medication_name,
  dose,
  frequency,
  started_on
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    'Lisinopril',
    '10 mg',
    'Once daily',
    now()::date - 120
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    'Vitamin D',
    '2000 IU',
    'Once daily',
    now()::date - 45
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666662',
    'Sertraline',
    '50 mg',
    'Once daily',
    now()::date - 60
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  patient_id = excluded.patient_id,
  medication_name = excluded.medication_name,
  dose = excluded.dose,
  frequency = excluded.frequency,
  started_on = excluded.started_on,
  ended_on = excluded.ended_on,
  updated_at = now();

insert into consents (id, organization_id, patient_id, consent_type, accepted, accepted_at, version)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    'telehealth',
    true,
    now() - interval '3 day',
    'v1'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666662',
    'telehealth',
    true,
    now() - interval '4 day',
    'v1'
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  patient_id = excluded.patient_id,
  consent_type = excluded.consent_type,
  accepted = excluded.accepted,
  accepted_at = excluded.accepted_at,
  version = excluded.version,
  updated_at = now();

insert into notifications (id, organization_id, profile_id, title, body, status, target_url)
values
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444443',
    'Appointment confirmed',
    'Your next virtual visit is scheduled for tomorrow at 10:00.',
    'unread',
    '/org/sunrise-virtual-clinic/appointments'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    'Open encounter requires documentation',
    'A same-day visit is checked in and waiting for SOAP completion.',
    'unread',
    '/org/sunrise-virtual-clinic/appointments/77777777-7777-7777-7777-777777777775/notes'
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  profile_id = excluded.profile_id,
  title = excluded.title,
  body = excluded.body,
  status = excluded.status,
  target_url = excluded.target_url;

insert into audit_logs (organization_id, actor_profile_id, entity_type, entity_id, action, metadata)
select
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444442',
  'appointments',
  '77777777-7777-7777-7777-777777777772',
  'appointment.status.completed',
  '{"from":"in_progress","to":"completed"}'::jsonb
where not exists (
  select 1
  from audit_logs
  where organization_id = '11111111-1111-1111-1111-111111111111'
    and entity_type = 'appointments'
    and entity_id = '77777777-7777-7777-7777-777777777772'
    and action = 'appointment.status.completed'
);

insert into audit_logs (organization_id, actor_profile_id, entity_type, entity_id, action, metadata)
select
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444442',
  'clinical_notes',
  '99999999-9999-9999-9999-999999999991',
  'clinical_note.signed',
  '{"note_type":"soap"}'::jsonb
where not exists (
  select 1
  from audit_logs
  where organization_id = '11111111-1111-1111-1111-111111111111'
    and entity_type = 'clinical_notes'
    and entity_id = '99999999-9999-9999-9999-999999999991'
    and action = 'clinical_note.signed'
);
