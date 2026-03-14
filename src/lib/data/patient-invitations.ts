import { createHash, randomBytes } from "crypto";

import { createServiceRoleClient } from "@/lib/supabase/server";

type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

function buildToken() {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isTableMissing(error: { code?: string } | null) {
  return Boolean(error && error.code === "PGRST205");
}

export type PatientInvitationRecord = {
  id: string;
  organization_id: string;
  invited_email: string;
  invited_full_name: string | null;
  invited_by_profile_id: string;
  invited_by_role: "org_admin" | "provider";
  provider_profile_id: string | null;
  token_hash: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export async function createPatientInvitation(input: {
  organizationId: string;
  invitedEmail: string;
  invitedFullName: string | null;
  invitedByProfileId: string;
  invitedByRole: "org_admin" | "provider";
  providerProfileId: string | null;
  expiresInHours?: number;
}) {
  const admin = createServiceRoleClient();
  const token = buildToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + (input.expiresInHours ?? 72) * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("patient_invitations")
    .insert({
      organization_id: input.organizationId,
      invited_email: input.invitedEmail,
      invited_full_name: input.invitedFullName,
      invited_by_profile_id: input.invitedByProfileId,
      invited_by_role: input.invitedByRole,
      provider_profile_id: input.providerProfileId,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (isTableMissing(error)) {
      throw new Error("Invitation storage is not available. Apply the latest database migrations.");
    }

    throw new Error(error?.message ?? "Unable to create invitation.");
  }

  return {
    invitationId: data.id,
    token,
    expiresAt,
  };
}

export async function getPendingInvitationByToken(token: string) {
  const admin = createServiceRoleClient();
  const tokenHash = hashToken(token);

  const { data, error } = await admin
    .from("patient_invitations")
    .select(
      "id, organization_id, invited_email, invited_full_name, invited_by_profile_id, invited_by_role, provider_profile_id, token_hash, status, expires_at, accepted_at, created_at, organization:organizations(id, name, slug, status)",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    if (isTableMissing(error)) {
      throw new Error("Invitation storage is not available. Apply the latest database migrations.");
    }

    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const organization = Array.isArray(data.organization) ? data.organization[0] : data.organization;

  if (!organization) {
    throw new Error("Invitation organization was not found.");
  }

  if (data.status !== "pending") {
    return { ...data, organization, invalidReason: "already_processed" };
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await admin
      .from("patient_invitations")
      .update({ status: "expired" })
      .eq("id", data.id)
      .eq("status", "pending");

    return { ...data, organization, invalidReason: "expired" };
  }

  if (organization.status !== "active") {
    return { ...data, organization, invalidReason: "org_inactive" };
  }

  return { ...data, organization, invalidReason: null };
}

export async function markInvitationAccepted(invitationId: string) {
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from("patient_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error && !isTableMissing(error)) {
    throw new Error(error.message);
  }
}

export async function listActiveInvitationsForOrg(organizationId: string) {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("patient_invitations")
    .select("id, invited_email, invited_full_name, invited_by_role, provider_profile_id, status, expires_at, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    if (isTableMissing(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return data ?? [];
}

export async function assignPatientToProvider(input: {
  organizationId: string;
  patientId: string;
  providerId: string;
  assignedByProfileId: string;
}) {
  const admin = createServiceRoleClient();

  const { error } = await admin.from("patient_provider_assignments").upsert(
    {
      organization_id: input.organizationId,
      patient_id: input.patientId,
      provider_id: input.providerId,
      assigned_by_profile_id: input.assignedByProfileId,
    },
    { onConflict: "organization_id,patient_id,provider_id" },
  );

  if (error && !isTableMissing(error)) {
    throw new Error(error.message);
  }
}

export async function getAssignedProviderIdsForPatient(organizationId: string, patientId: string) {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("patient_provider_assignments")
    .select("provider_id")
    .eq("organization_id", organizationId)
    .eq("patient_id", patientId);

  if (error) {
    if (isTableMissing(error)) {
      return [] as string[];
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.provider_id);
}
