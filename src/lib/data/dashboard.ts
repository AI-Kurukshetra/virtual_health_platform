import { createClient } from "@/lib/supabase/server";
import { getDayRangeInTimeZone } from "@/lib/timezone";

export async function getAdminDashboardData(organizationId: string) {
  const supabase = await createClient();

  const [{ count: patientCount }, { count: providerCount }, { count: appointmentCount }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("providers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);

  return {
    patientCount: patientCount ?? 0,
    providerCount: providerCount ?? 0,
    appointmentCount: appointmentCount ?? 0,
  };
}

export async function getProviderDashboardData(organizationId: string, profileId: string) {
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, timezone")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .single();

  if (!provider) {
    return {
      timeZone: null,
      todayAppointments: [],
      pendingNotesCount: 0,
    };
  }

  const timeZone = provider.timezone ?? "UTC";
  const dayRange = getDayRangeInTimeZone(new Date(), timeZone);

  const [{ data: todayAppointments }, { count: pendingNotesCount }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_start, scheduled_end, status, reason, patient:patients(full_name)")
      .eq("organization_id", organizationId)
      .eq("provider_id", provider.id)
      .gte("scheduled_start", dayRange.start.toISOString())
      .lt("scheduled_start", dayRange.endExclusive.toISOString())
      .order("scheduled_start"),
    supabase
      .from("encounters")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("provider_id", provider.id)
      .eq("status", "open"),
  ]);

  return {
    timeZone,
    todayAppointments:
      (todayAppointments ?? []).map((appointment) => ({
        ...appointment,
        patient: Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient,
      })) ?? [],
    pendingNotesCount: pendingNotesCount ?? 0,
  };
}

export async function getPatientDashboardData(organizationId: string, profileId: string) {
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, intake_completed")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .single();

  if (!patient) {
    return {
      patient: null,
      upcomingAppointment: null,
      chartSummary: { allergies: 0, medications: 0, notes: 0 },
    };
  }

  const nowIso = new Date().toISOString();

  const [{ data: upcomingAppointment }, { count: allergies }, { count: medications }, { count: notes }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_start, scheduled_end, status, meeting_url, provider:providers(specialty, timezone)")
        .eq("organization_id", organizationId)
        .eq("patient_id", patient.id)
        .gte("scheduled_start", nowIso)
        .in("status", ["scheduled", "checked_in", "in_progress"])
        .order("scheduled_start")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("patient_allergies")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("patient_id", patient.id),
      supabase
        .from("patient_medications")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("patient_id", patient.id),
      supabase
        .from("clinical_notes")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("patient_id", patient.id),
    ]);

  return {
    patient,
    upcomingAppointment: upcomingAppointment
      ? {
          ...upcomingAppointment,
          provider: Array.isArray(upcomingAppointment.provider)
            ? upcomingAppointment.provider[0]
            : upcomingAppointment.provider,
        }
      : null,
    chartSummary: {
      allergies: allergies ?? 0,
      medications: medications ?? 0,
      notes: notes ?? 0,
    },
  };
}
