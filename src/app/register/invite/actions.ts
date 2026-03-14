"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  assignPatientToProvider,
  getPendingInvitationByToken,
  markInvitationAccepted,
} from "@/lib/data/patient-invitations";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type InviteRegisterState = {
  error: string | null;
  fieldErrors: Record<string, string | undefined>;
};

const inviteRegisterSchema = z
  .object({
    token: z.string().min(16),
    fullName: z.string().trim().min(2).max(100),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
    dob: z
      .string()
      .optional()
      .transform((value) => (value ?? "").trim())
      .refine((value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: "Date of birth must use YYYY-MM-DD format.",
      }),
    sex: z
      .string()
      .optional()
      .transform((value) => (value ?? "").trim().toLowerCase())
      .refine((value) => value.length === 0 || ["female", "male", "other", "prefer_not_to_say"].includes(value), {
        message: "Select a valid sex option.",
      }),
    phone: z
      .string()
      .optional()
      .transform((value) => (value ?? "").trim())
      .refine((value) => value.length === 0 || /^[0-9+()\-\s]{7,20}$/.test(value), {
        message: "Enter a valid phone number.",
      }),
    consentAccepted: z.boolean().refine((value) => value, {
      message: "You must accept telehealth consent to register.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function buildValidationState(error: z.ZodError): InviteRegisterState {
  const fieldErrors: Record<string, string | undefined> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    error: "Please review the highlighted fields and try again.",
    fieldErrors,
  };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Patient";
  const lastName = parts.slice(1).join(" ") || "User";
  return { firstName, lastName };
}

function isDuplicateAuthError(message: string): boolean {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("already registered") ||
    lowered.includes("already exists") ||
    lowered.includes("user already") ||
    lowered.includes("duplicate")
  );
}

async function upsertPatientInSnakeSchema(input: {
  userId: string;
  organizationId: string;
  email: string;
  fullName: string;
  dob: string | null;
  sex: string | null;
  phone: string | null;
  consentAccepted: boolean;
  providerProfileId: string | null;
}) {
  const admin = createServiceRoleClient();

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: input.userId,
      full_name: input.fullName,
      email: input.email,
      global_role: "patient",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Profile setup failed: ${profileError.message}`);
  }

  const { error: membershipError } = await admin.from("memberships").upsert(
    {
      organization_id: input.organizationId,
      profile_id: input.userId,
      role: "patient",
      status: "active",
    },
    { onConflict: "organization_id,profile_id" },
  );

  if (membershipError) {
    throw new Error(`Organization membership failed: ${membershipError.message}`);
  }

  const now = new Date().toISOString();

  const existing = await admin
    .from("patients")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("profile_id", input.userId)
    .maybeSingle();

  if (existing.error && existing.error.code !== "PGRST116") {
    throw new Error(existing.error.message);
  }

  let patientId = existing.data?.id ?? null;

  if (patientId) {
    const { error: updateError } = await admin
      .from("patients")
      .update({
        full_name: input.fullName,
        dob: input.dob,
        sex: input.sex,
        phone: input.phone,
        email: input.email,
        status: "active",
        intake_completed: true,
        intake_completed_at: now,
        consent_accepted_at: input.consentAccepted ? now : null,
      })
      .eq("id", patientId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { data: patientRecord, error: patientError } = await admin
      .from("patients")
      .insert({
        organization_id: input.organizationId,
        profile_id: input.userId,
        full_name: input.fullName,
        dob: input.dob,
        sex: input.sex,
        phone: input.phone,
        email: input.email,
        status: "active",
        intake_completed: true,
        intake_completed_at: now,
        consent_accepted_at: input.consentAccepted ? now : null,
      })
      .select("id")
      .single();

    if (patientError || !patientRecord) {
      throw new Error(patientError?.message ?? "Unable to create patient record.");
    }

    patientId = patientRecord.id;
  }

  if (input.consentAccepted) {
    await admin.from("consents").insert({
      organization_id: input.organizationId,
      patient_id: patientId,
      consent_type: "telehealth",
      accepted: true,
      accepted_at: now,
      version: "v1",
    });
  }

  if (input.providerProfileId) {
    const { data: provider } = await admin
      .from("providers")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("profile_id", input.providerProfileId)
      .maybeSingle();

    if (provider?.id) {
      await assignPatientToProvider({
        organizationId: input.organizationId,
        patientId,
        providerId: provider.id,
        assignedByProfileId: input.providerProfileId,
      });
    }
  }
}

async function upsertPatientInPascalSchema(input: {
  userId: string;
  organizationId: string;
  email: string;
  fullName: string;
  dob: string | null;
  sex: string | null;
  phone: string | null;
}) {
  const admin = createServiceRoleClient();
  const { firstName, lastName } = splitName(input.fullName);

  const { error: userError } = await admin.from("Users").upsert(
    {
      id: input.userId,
      organization_id: input.organizationId,
      email: input.email,
      first_name: firstName,
      last_name: lastName,
      phone: input.phone,
      status: "active",
    },
    { onConflict: "id" },
  );

  if (userError) {
    throw new Error(userError.message);
  }

  const existing = await admin
    .from("Patients")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing.error && existing.error.code !== "PGRST116") {
    throw new Error(existing.error.message);
  }

  if (existing.data?.id) {
    const { error: updateError } = await admin
      .from("Patients")
      .update({
        dob: input.dob,
        sex_at_birth: input.sex,
        phone: input.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.data.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const fallbackMrn = `MRN-${input.organizationId.replace(/-/g, "").slice(0, 6)}-${input.userId.slice(0, 6)}`;

    const { error: insertError } = await admin.from("Patients").insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      mrn: fallbackMrn,
      dob: input.dob,
      sex_at_birth: input.sex,
      phone: input.phone,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

async function syncInvitationPatientData(input: {
  userId: string;
  organizationId: string;
  email: string;
  fullName: string;
  dob: string | null;
  sex: string | null;
  phone: string | null;
  consentAccepted: boolean;
  providerProfileId: string | null;
}) {
  const admin = createServiceRoleClient();
  const orgCheck = await admin.from("organizations").select("id").eq("id", input.organizationId).maybeSingle();

  if (!orgCheck.error) {
    await upsertPatientInSnakeSchema(input);
    return;
  }

  if (orgCheck.error.code !== "PGRST205") {
    throw new Error(orgCheck.error.message);
  }

  await upsertPatientInPascalSchema(input);
}

export async function completeInvitationRegistration(
  _previousState: InviteRegisterState,
  formData: FormData,
): Promise<InviteRegisterState> {
  const parsed = inviteRegisterSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    dob: formData.get("dob")?.toString() ?? undefined,
    sex: formData.get("sex")?.toString() ?? undefined,
    phone: formData.get("phone")?.toString() ?? undefined,
    consentAccepted: formData.get("consentAccepted") === "on",
  });

  if (!parsed.success) {
    return buildValidationState(parsed.error);
  }

  try {
    const invitation = await getPendingInvitationByToken(parsed.data.token);

    if (!invitation || invitation.invalidReason) {
      return {
        error:
          invitation?.invalidReason === "expired"
            ? "This invitation has expired. Ask your clinic to send a new invitation."
            : invitation?.invalidReason === "already_processed"
              ? "This invitation has already been used. Please sign in."
              : "This invitation link is invalid.",
        fieldErrors: {},
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId: string | null = null;

    if (user?.id && user.email?.toLowerCase() === invitation.invited_email.toLowerCase()) {
      const { error: updateUserError } = await supabase.auth.updateUser({
        password: parsed.data.password,
        data: { full_name: parsed.data.fullName, role: "patient" },
      });

      if (updateUserError) {
        return {
          error: "Unable to finalize account credentials. Please retry from the invitation email.",
          fieldErrors: {},
        };
      }

      userId = user.id;
    } else {
      const signUp = await supabase.auth.signUp({
        email: invitation.invited_email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.fullName,
            role: "patient",
          },
        },
      });

      if (signUp.error) {
        if (isDuplicateAuthError(signUp.error.message)) {
          return {
            error:
              "An account already exists for this invited email. Sign in and ask your clinic for a refreshed invitation if assignment is missing.",
            fieldErrors: {},
          };
        }

        return {
          error: "Unable to create account from invitation. Please try again.",
          fieldErrors: {},
        };
      }

      userId = signUp.data.user?.id ?? null;
    }

    if (!userId) {
      return {
        error: "Unable to determine account identity from invitation. Please try again.",
        fieldErrors: {},
      };
    }

    await syncInvitationPatientData({
      userId,
      organizationId: invitation.organization_id,
      email: invitation.invited_email,
      fullName: parsed.data.fullName,
      dob: parsed.data.dob || null,
      sex: parsed.data.sex || null,
      phone: parsed.data.phone || null,
      consentAccepted: parsed.data.consentAccepted,
      providerProfileId: invitation.provider_profile_id,
    });

    await markInvitationAccepted(invitation.id);

    const resend = await supabase.auth.resend({
      type: "signup",
      email: invitation.invited_email,
    });

    await supabase.auth.signOut();

    const resendErrorMessage = resend.error?.message.toLowerCase() ?? "";
    const resendFailed = Boolean(resend.error) && !resendErrorMessage.includes("security purposes");

    const params = new URLSearchParams({
      verify_email: "1",
      email: invitation.invited_email,
      ...(resendFailed ? { resend_failed: "1" } : {}),
    });

    redirect(`/login?${params.toString()}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to complete invitation registration.",
      fieldErrors: {},
    };
  }
}
