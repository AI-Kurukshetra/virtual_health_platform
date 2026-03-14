import { createClient } from "@/lib/supabase/server";
import type { AppRole, AppointmentStatus } from "@/types/app";
import { getAllowedAppointmentStatusTransitions } from "@/lib/data/appointments-shared";
import { slotMatchesAvailability } from "@/lib/data/slots";

async function insertAuditLog({
  organizationId,
  actorProfileId,
  entityType,
  entityId,
  action,
  metadata,
}: {
  organizationId: string;
  actorProfileId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_profile_id: actorProfileId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata: metadata ?? {},
  });
}

export async function listAppointments({
  organizationId,
  role,
  profileId,
}: {
  organizationId: string;
  role: AppRole;
  profileId: string;
}) {
  const supabase = await createClient();

  let patientId: string | null = null;
  let providerId: string | null = null;

  if (role === "patient") {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("profile_id", profileId)
      .maybeSingle();

    patientId = patient?.id ?? null;
  }

  if (role === "provider") {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("profile_id", profileId)
      .maybeSingle();

    providerId = provider?.id ?? null;
  }

  let query = supabase
    .from("appointments")
    .select("id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, meeting_url")
    .eq("organization_id", organizationId)
    .order("scheduled_start", { ascending: false });

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  if (providerId) {
    query = query.eq("provider_id", providerId);
  }

  const { data: appointments } = await query;

  const rows = appointments ?? [];
  const patientIds = [...new Set(rows.map((item) => item.patient_id))];
  const providerIds = [...new Set(rows.map((item) => item.provider_id))];

  const [{ data: patients }, { data: providers }] = await Promise.all([
    patientIds.length
      ? supabase
          .from("patients")
          .select("id, full_name")
          .eq("organization_id", organizationId)
          .in("id", patientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    providerIds.length
      ? supabase
          .from("providers")
          .select("id, timezone, profile:profiles(full_name)")
          .eq("organization_id", organizationId)
          .in("id", providerIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; timezone: string | null; profile: { full_name: string } | null }>,
        }),
  ]);

  const patientMap = new Map((patients ?? []).map((patient) => [patient.id, patient.full_name]));
  const providerMap = new Map(
    (providers ?? []).map((provider) => {
      const profile = Array.isArray(provider.profile) ? provider.profile[0] : provider.profile;
      return [provider.id, { name: profile?.full_name ?? "Provider", timezone: provider.timezone ?? "UTC" }];
    }),
  );

  return rows.map((appointment) => ({
    ...appointment,
    patient_name: patientMap.get(appointment.patient_id) ?? "Patient",
    provider_name: providerMap.get(appointment.provider_id)?.name ?? "Provider",
    provider_timezone: providerMap.get(appointment.provider_id)?.timezone ?? "UTC",
  }));
}

export async function getAppointmentDetail(organizationId: string, appointmentId: string) {
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, organization_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, meeting_url, created_by",
    )
    .eq("organization_id", organizationId)
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return null;
  }

  const [{ data: patient }, { data: provider }, { data: encounter }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, email")
      .eq("organization_id", organizationId)
      .eq("id", appointment.patient_id)
      .single(),
    supabase
      .from("providers")
      .select("id, specialty, timezone, profile:profiles(full_name, email)")
      .eq("organization_id", organizationId)
      .eq("id", appointment.provider_id)
      .single(),
    supabase
      .from("encounters")
      .select("id, status, started_at, ended_at")
      .eq("organization_id", organizationId)
      .eq("appointment_id", appointment.id)
      .maybeSingle(),
  ]);

  const { data: note } = encounter
    ? await supabase
        .from("clinical_notes")
        .select("id, signed_at")
        .eq("organization_id", organizationId)
        .eq("encounter_id", encounter.id)
        .maybeSingle()
    : { data: null };

  return {
    ...appointment,
    patient,
    provider: provider
      ? {
          ...provider,
          profile: Array.isArray(provider.profile) ? provider.profile[0] : provider.profile,
        }
      : null,
    encounter,
    note,
  };
}

export async function createAppointmentWithChecks({
  organizationId,
  actorProfileId,
  patientId,
  providerId,
  scheduledStart,
  scheduledEnd,
  reason,
  meetingUrl,
}: {
  organizationId: string;
  actorProfileId: string;
  patientId: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  reason: string | null;
  meetingUrl: string | null;
}) {
  const supabase = await createClient();
  const slotStart = new Date(scheduledStart);
  const slotEnd = new Date(scheduledEnd);

  if (!(slotStart instanceof Date) || Number.isNaN(slotStart.getTime())) {
    throw new Error("Invalid appointment start time.");
  }

  if (!(slotEnd instanceof Date) || Number.isNaN(slotEnd.getTime()) || slotEnd <= slotStart) {
    throw new Error("Invalid appointment end time.");
  }

  if (slotStart <= new Date()) {
    throw new Error("Appointments can only be booked for future slots.");
  }

  const [{ data: provider }, { data: patient }, { data: providerConflicts }, { data: patientConflicts }, { data: availability }] =
    await Promise.all([
      supabase
        .from("providers")
        .select("id, timezone")
        .eq("organization_id", organizationId)
        .eq("id", providerId)
        .maybeSingle(),
      supabase
        .from("patients")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("id", patientId)
        .maybeSingle(),
      supabase
        .from("appointments")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("provider_id", providerId)
        .in("status", ["scheduled", "checked_in", "in_progress"])
        .lt("scheduled_start", scheduledEnd)
        .gt("scheduled_end", scheduledStart)
        .limit(1),
      supabase
        .from("appointments")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("patient_id", patientId)
        .in("status", ["scheduled", "checked_in", "in_progress"])
        .lt("scheduled_start", scheduledEnd)
        .gt("scheduled_end", scheduledStart)
        .limit(1),
      supabase
        .from("provider_availability")
        .select("id, provider_id, day_of_week, start_time, end_time, slot_minutes, is_active")
        .eq("organization_id", organizationId)
        .eq("provider_id", providerId)
        .eq("is_active", true),
    ]);

  if (!provider) {
    throw new Error("Provider record not found in this organization.");
  }

  if (!patient) {
    throw new Error("Patient record not found in this organization.");
  }

  if ((providerConflicts ?? []).length > 0) {
    throw new Error("This provider already has an appointment in the selected slot.");
  }

  if ((patientConflicts ?? []).length > 0) {
    throw new Error("This patient already has an appointment in the selected slot.");
  }

  const availabilityWithTimeZone = (availability ?? []).map((rule) => ({
    ...rule,
    timezone: provider.timezone ?? "UTC",
  }));

  if (
    !slotMatchesAvailability({
      availability: availabilityWithTimeZone,
      providerId,
      scheduledStart: slotStart,
      scheduledEnd: slotEnd,
    })
  ) {
    throw new Error("Selected time no longer matches the provider's active availability.");
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: organizationId,
      patient_id: patientId,
      provider_id: providerId,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      status: "scheduled",
      visit_type: "virtual",
      meeting_url: meetingUrl,
      reason,
      created_by: actorProfileId,
    })
    .select("id")
    .single();

  if (error || !appointment) {
    throw new Error(error?.message ?? "Unable to create appointment.");
  }

  await insertAuditLog({
    organizationId,
    actorProfileId,
    entityType: "appointments",
    entityId: appointment.id,
    action: "appointment.created",
    metadata: {
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      provider_id: providerId,
      patient_id: patientId,
    },
  });

  return appointment.id;
}

export async function updateAppointmentStatus({
  organizationId,
  actorProfileId,
  actorRole,
  appointmentId,
  status,
}: {
  organizationId: string;
  actorProfileId: string;
  actorRole: AppRole;
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id, status")
    .eq("organization_id", organizationId)
    .eq("id", appointmentId)
    .single();

  if (!existing) {
    throw new Error("Appointment not found.");
  }

  const currentStatus = existing.status as AppointmentStatus;
  const allowedTransitions = getAllowedAppointmentStatusTransitions(actorRole, currentStatus);

  if (!allowedTransitions.includes(status)) {
    throw new Error(`Cannot move appointment from ${currentStatus} to ${status}.`);
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("organization_id", organizationId)
    .eq("id", appointmentId);

  if (error) {
    throw new Error(error.message);
  }

  if (status === "in_progress") {
    await supabase.from("encounters").upsert(
      {
        organization_id: organizationId,
        appointment_id: appointmentId,
        patient_id: existing.patient_id,
        provider_id: existing.provider_id,
        status: "open",
        started_at: new Date().toISOString(),
      },
      { onConflict: "appointment_id" },
    );
  }

  if (status === "completed") {
    await supabase
      .from("encounters")
      .update({ status: "closed", ended_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("appointment_id", appointmentId);
  }

  await insertAuditLog({
    organizationId,
    actorProfileId,
    entityType: "appointments",
    entityId: appointmentId,
    action: "appointment.status.updated",
    metadata: { from: existing.status, to: status },
  });
}

export async function getEncounterForAppointment({
  organizationId,
  appointmentId,
}: {
  organizationId: string;
  appointmentId: string;
}) {
  const supabase = await createClient();

  const { data: encounter } = await supabase
    .from("encounters")
    .select("id, patient_id, provider_id, status")
    .eq("organization_id", organizationId)
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  return encounter;
}

export async function saveSoapNote({
  organizationId,
  actorProfileId,
  appointmentId,
  subjective,
  objective,
  assessment,
  plan,
}: {
  organizationId: string;
  actorProfileId: string;
  appointmentId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}) {
  const supabase = await createClient();
  const [{ data: appointment }, encounter] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, status")
      .eq("organization_id", organizationId)
      .eq("id", appointmentId)
      .single(),
    getEncounterForAppointment({ organizationId, appointmentId }),
  ]);

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  if (appointment.status !== "in_progress") {
    throw new Error("Start the visit before signing a SOAP note.");
  }

  if (!encounter) {
    throw new Error("Encounter record is missing. Start the visit again to initialize the encounter.");
  }

  const { data: existingNote } = await supabase
    .from("clinical_notes")
    .select("id, signed_at")
    .eq("organization_id", organizationId)
    .eq("encounter_id", encounter.id)
    .maybeSingle();

  if (existingNote?.signed_at) {
    throw new Error("Signed SOAP notes are read-only.");
  }

  const { data: note, error } = await supabase
    .from("clinical_notes")
    .upsert(
      {
        organization_id: organizationId,
        encounter_id: encounter.id,
        patient_id: encounter.patient_id,
        provider_id: encounter.provider_id,
        note_type: "soap",
        subjective,
        objective,
        assessment,
        plan,
        signed_at: new Date().toISOString(),
      },
      { onConflict: "encounter_id" },
    )
    .select("id")
    .single();

  if (error || !note) {
    throw new Error(error?.message ?? "Unable to save SOAP note.");
  }

  await supabase
    .from("encounters")
    .update({ status: "closed", ended_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", encounter.id);

  await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("organization_id", organizationId)
    .eq("id", appointmentId);

  await insertAuditLog({
    organizationId,
    actorProfileId,
    entityType: "clinical_notes",
    entityId: note.id,
    action: "clinical_note.signed",
    metadata: { appointment_id: appointmentId },
  });

  await insertAuditLog({
    organizationId,
    actorProfileId,
    entityType: "appointments",
    entityId: appointmentId,
    action: "appointment.status.updated",
    metadata: { to: "completed" },
  });
}

export async function listProviderAppointmentWindows(organizationId: string, providerId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select("provider_id, scheduled_start, scheduled_end, status")
    .eq("organization_id", organizationId)
    .eq("provider_id", providerId)
    .in("status", ["scheduled", "checked_in", "in_progress"]);

  return data ?? [];
}

export async function listActiveAppointmentWindowsForOrg(organizationId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select("provider_id, scheduled_start, scheduled_end, status")
    .eq("organization_id", organizationId)
    .in("status", ["scheduled", "checked_in", "in_progress"]);

  return data ?? [];
}

export async function getSoapNoteForAppointment(organizationId: string, appointmentId: string) {
  const supabase = await createClient();
  const encounter = await getEncounterForAppointment({ organizationId, appointmentId });

  if (!encounter) {
    return null;
  }

  const { data: note } = await supabase
    .from("clinical_notes")
    .select("id, subjective, objective, assessment, plan, signed_at")
    .eq("organization_id", organizationId)
    .eq("encounter_id", encounter.id)
    .maybeSingle();

  return note;
}
