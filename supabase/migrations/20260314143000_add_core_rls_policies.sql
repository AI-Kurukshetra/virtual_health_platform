-- Tenant-safe row level security policies for the MVP.

create or replace function is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and global_role = 'platform_admin'
  );
$$;

create or replace function has_org_membership(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from memberships
    where organization_id = target_org
      and profile_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function has_org_role(target_org uuid, allowed_roles app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from memberships
    where organization_id = target_org
      and profile_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

grant usage on schema public to authenticated;

grant select, insert, update, delete on organizations to authenticated;
grant select, insert, update, delete on profiles to authenticated;
grant select, insert, update, delete on memberships to authenticated;
grant select, insert, update, delete on patients to authenticated;
grant select, insert, update, delete on providers to authenticated;
grant select, insert, update, delete on provider_availability to authenticated;
grant select, insert, update, delete on appointments to authenticated;
grant select, insert, update, delete on encounters to authenticated;
grant select, insert, update, delete on clinical_notes to authenticated;
grant select, insert, update, delete on patient_allergies to authenticated;
grant select, insert, update, delete on patient_medications to authenticated;
grant select, insert, update, delete on consents to authenticated;
grant select, insert, update, delete on notifications to authenticated;
grant select, insert on audit_logs to authenticated;

grant usage, select on sequence audit_logs_id_seq to authenticated;

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table patients enable row level security;
alter table providers enable row level security;
alter table provider_availability enable row level security;
alter table appointments enable row level security;
alter table encounters enable row level security;
alter table clinical_notes enable row level security;
alter table patient_allergies enable row level security;
alter table patient_medications enable row level security;
alter table consents enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

drop policy if exists organizations_select on organizations;
create policy organizations_select on organizations
for select
using (is_platform_admin() or has_org_membership(id));

drop policy if exists organizations_insert on organizations;
create policy organizations_insert on organizations
for insert
with check (is_platform_admin());

drop policy if exists organizations_update on organizations;
create policy organizations_update on organizations
for update
using (is_platform_admin())
with check (is_platform_admin());

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
for select
using (
  id = auth.uid()
  or is_platform_admin()
  or exists (
    select 1
    from memberships requester
    join memberships target
      on target.organization_id = requester.organization_id
    where requester.profile_id = auth.uid()
      and requester.status = 'active'
      and target.profile_id = profiles.id
      and target.status = 'active'
  )
);

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles
for insert
with check (id = auth.uid() or is_platform_admin());

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles
for update
using (id = auth.uid() or is_platform_admin())
with check (id = auth.uid() or is_platform_admin());

drop policy if exists memberships_select on memberships;
create policy memberships_select on memberships
for select
using (is_platform_admin() or has_org_membership(organization_id));

drop policy if exists memberships_insert on memberships;
create policy memberships_insert on memberships
for insert
with check (
  is_platform_admin()
  or has_org_role(organization_id, array['org_admin']::app_role[])
);

drop policy if exists memberships_update on memberships;
create policy memberships_update on memberships
for update
using (
  is_platform_admin()
  or has_org_role(organization_id, array['org_admin']::app_role[])
)
with check (
  is_platform_admin()
  or has_org_role(organization_id, array['org_admin']::app_role[])
);

drop policy if exists memberships_delete on memberships;
create policy memberships_delete on memberships
for delete
using (
  is_platform_admin()
  or has_org_role(organization_id, array['org_admin']::app_role[])
);

drop policy if exists patients_select on patients;
create policy patients_select on patients
for select
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or profile_id = auth.uid()
);

drop policy if exists patients_insert on patients;
create policy patients_insert on patients
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patients_update on patients;
create policy patients_update on patients
for update
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or profile_id = auth.uid()
)
with check (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or profile_id = auth.uid()
);

drop policy if exists patients_delete on patients;
create policy patients_delete on patients
for delete
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists providers_select on providers;
create policy providers_select on providers
for select
using (has_org_membership(organization_id));

drop policy if exists providers_insert on providers;
create policy providers_insert on providers
for insert
with check (has_org_role(organization_id, array['org_admin']::app_role[]));

drop policy if exists providers_update on providers;
create policy providers_update on providers
for update
using (
  has_org_role(organization_id, array['org_admin']::app_role[])
  or profile_id = auth.uid()
)
with check (
  has_org_role(organization_id, array['org_admin']::app_role[])
  or profile_id = auth.uid()
);

drop policy if exists providers_delete on providers;
create policy providers_delete on providers
for delete
using (has_org_role(organization_id, array['org_admin']::app_role[]));

drop policy if exists provider_availability_select on provider_availability;
create policy provider_availability_select on provider_availability
for select
using (has_org_membership(organization_id));

drop policy if exists provider_availability_insert on provider_availability;
create policy provider_availability_insert on provider_availability
for insert
with check (
  has_org_role(organization_id, array['org_admin']::app_role[])
  or (
    has_org_role(organization_id, array['provider']::app_role[])
    and exists (
      select 1
      from providers
      where providers.id = provider_availability.provider_id
        and providers.profile_id = auth.uid()
    )
  )
);

drop policy if exists provider_availability_update on provider_availability;
create policy provider_availability_update on provider_availability
for update
using (
  has_org_role(organization_id, array['org_admin']::app_role[])
  or (
    has_org_role(organization_id, array['provider']::app_role[])
    and exists (
      select 1
      from providers
      where providers.id = provider_availability.provider_id
        and providers.profile_id = auth.uid()
    )
  )
)
with check (
  has_org_role(organization_id, array['org_admin']::app_role[])
  or (
    has_org_role(organization_id, array['provider']::app_role[])
    and exists (
      select 1
      from providers
      where providers.id = provider_availability.provider_id
        and providers.profile_id = auth.uid()
    )
  )
);

drop policy if exists provider_availability_delete on provider_availability;
create policy provider_availability_delete on provider_availability
for delete
using (
  has_org_role(organization_id, array['org_admin']::app_role[])
  or (
    has_org_role(organization_id, array['provider']::app_role[])
    and exists (
      select 1
      from providers
      where providers.id = provider_availability.provider_id
        and providers.profile_id = auth.uid()
    )
  )
);

drop policy if exists appointments_select on appointments;
create policy appointments_select on appointments
for select
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists appointments_insert on appointments;
create policy appointments_insert on appointments
for insert
with check (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or (
    has_org_role(organization_id, array['patient']::app_role[])
    and exists (
      select 1
      from patients
      where patients.id = appointments.patient_id
        and patients.profile_id = auth.uid()
    )
    and created_by = auth.uid()
  )
);

drop policy if exists appointments_update on appointments;
create policy appointments_update on appointments
for update
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
  )
)
with check (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists appointments_delete on appointments;
create policy appointments_delete on appointments
for delete
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists encounters_select on encounters;
create policy encounters_select on encounters
for select
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = encounters.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists encounters_insert on encounters;
create policy encounters_insert on encounters
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists encounters_update on encounters;
create policy encounters_update on encounters
for update
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]))
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists clinical_notes_select on clinical_notes;
create policy clinical_notes_select on clinical_notes
for select
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = clinical_notes.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists clinical_notes_insert on clinical_notes;
create policy clinical_notes_insert on clinical_notes
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists clinical_notes_update on clinical_notes;
create policy clinical_notes_update on clinical_notes
for update
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]))
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_allergies_select on patient_allergies;
create policy patient_allergies_select on patient_allergies
for select
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = patient_allergies.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists patient_allergies_insert on patient_allergies;
create policy patient_allergies_insert on patient_allergies
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_allergies_update on patient_allergies;
create policy patient_allergies_update on patient_allergies
for update
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]))
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_allergies_delete on patient_allergies;
create policy patient_allergies_delete on patient_allergies
for delete
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_medications_select on patient_medications;
create policy patient_medications_select on patient_medications
for select
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = patient_medications.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists patient_medications_insert on patient_medications;
create policy patient_medications_insert on patient_medications
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_medications_update on patient_medications;
create policy patient_medications_update on patient_medications
for update
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]))
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists patient_medications_delete on patient_medications;
create policy patient_medications_delete on patient_medications
for delete
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists consents_select on consents;
create policy consents_select on consents
for select
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = consents.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists consents_insert on consents;
create policy consents_insert on consents
for insert
with check (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = consents.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists consents_update on consents;
create policy consents_update on consents
for update
using (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = consents.patient_id
      and patients.profile_id = auth.uid()
  )
)
with check (
  has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
  or exists (
    select 1
    from patients
    where patients.id = consents.patient_id
      and patients.profile_id = auth.uid()
  )
);

drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
for select
using (
  profile_id = auth.uid()
  or has_org_role(organization_id, array['org_admin', 'provider']::app_role[])
);

drop policy if exists notifications_insert on notifications;
create policy notifications_insert on notifications
for insert
with check (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications
for update
using (profile_id = auth.uid() or has_org_role(organization_id, array['org_admin', 'provider']::app_role[]))
with check (profile_id = auth.uid() or has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists audit_logs_select on audit_logs;
create policy audit_logs_select on audit_logs
for select
using (has_org_role(organization_id, array['org_admin', 'provider']::app_role[]));

drop policy if exists audit_logs_insert on audit_logs;
create policy audit_logs_insert on audit_logs
for insert
with check (has_org_membership(organization_id));
