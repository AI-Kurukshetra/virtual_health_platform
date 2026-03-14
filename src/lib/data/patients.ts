import { createClient } from "@/lib/supabase/server";

export async function listPatients(organizationId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("patients")
    .select(
      "id, full_name, dob, sex, phone, email, status, intake_completed, consent_accepted_at, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getPatientByProfile(organizationId: string, profileId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("patients")
    .select("id, full_name, intake_completed")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .maybeSingle();

  return data;
}

export async function getPatientByEmail(organizationId: string, email: string) {
  const supabase = await createClient();

  const normalizedEmail = email.trim().toLowerCase();

  const { data } = await supabase
    .from("patients")
    .select("id, full_name, email")
    .eq("organization_id", organizationId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  return data;
}

export async function getPatientChart(organizationId: string, patientId: string) {
  const supabase = await createClient();

  const [{ data: patient }, { data: allergies }, { data: medications }, { data: notes }] =
    await Promise.all([
      supabase
        .from("patients")
        .select(
          "id, full_name, dob, sex, phone, email, status, intake_completed, intake_completed_at, consent_accepted_at",
        )
        .eq("organization_id", organizationId)
        .eq("id", patientId)
        .single(),
      supabase
        .from("patient_allergies")
        .select("id, allergen, reaction, severity, created_at")
        .eq("organization_id", organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_medications")
        .select("id, medication_name, dose, frequency, started_on, ended_on, created_at")
        .eq("organization_id", organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("clinical_notes")
        .select("id, signed_at, subjective, objective, assessment, plan, created_at")
        .eq("organization_id", organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    patient,
    allergies: allergies ?? [],
    medications: medications ?? [],
    notes: notes ?? [],
  };
}

export async function createPatientRecord({
  organizationId,
  actorProfileId,
  fullName,
  dob,
  sex,
  phone,
  email,
  intakeCompleted,
  consentAccepted,
}: {
  organizationId: string;
  actorProfileId: string;
  fullName: string;
  dob: string | null;
  sex: string | null;
  phone: string | null;
  email: string | null;
  intakeCompleted: boolean;
  consentAccepted: boolean;
}) {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      organization_id: organizationId,
      full_name: fullName,
      dob,
      sex,
      phone,
      email,
      intake_completed: intakeCompleted,
      intake_completed_at: intakeCompleted ? new Date().toISOString() : null,
      consent_accepted_at: consentAccepted ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !patient) {
    throw new Error(error?.message ?? "Failed to create patient record.");
  }

  if (consentAccepted) {
    await supabase.from("consents").insert({
      organization_id: organizationId,
      patient_id: patient.id,
      consent_type: "telehealth",
      accepted: true,
      accepted_at: new Date().toISOString(),
      version: "v1",
    });
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_profile_id: actorProfileId,
    entity_type: "patients",
    entity_id: patient.id,
    action: "patient.created",
    metadata: {
      intake_completed: intakeCompleted,
      consent_accepted: consentAccepted,
    },
  });

  return patient.id;
}
