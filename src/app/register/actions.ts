"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

type RegisterFieldErrors = Record<string, string | undefined>;

export type RegisterState = {
  error: string | null;
  fieldErrors: RegisterFieldErrors;
};

const ALLOWED_SEX_VALUES = ["female", "male", "other", "prefer_not_to_say"] as const;

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must be at most 100 characters."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address.")
      .max(254, "Email is too long."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be at most 72 characters."),
    confirmPassword: z.string(),
    dob: z
      .string()
      .optional()
      .transform((value) => (value ?? "").trim())
      .refine((value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: "Date of birth must use YYYY-MM-DD format.",
      })
      .refine((value) => {
        if (!value) return true;
        const date = new Date(`${value}T00:00:00.000Z`);
        if (Number.isNaN(date.getTime())) return false;

        const now = new Date();
        const latest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()));

        return date <= latest && date >= oldest;
      }, "Enter a realistic date of birth."),
    sex: z
      .string()
      .optional()
      .transform((value) => (value ?? "").trim().toLowerCase())
      .refine((value) => value.length === 0 || ALLOWED_SEX_VALUES.includes(value as (typeof ALLOWED_SEX_VALUES)[number]), {
        message: "Select a valid sex option.",
      }),
    phone: z
      .string()
      .optional()
      .transform((value) => (value ?? "").trim())
      .refine((value) => value.length === 0 || /^[0-9+()\-\s]{7,20}$/.test(value), {
        message: "Enter a valid phone number.",
      }),
    organizationId: z.string().uuid("Select an organization."),
    consentAccepted: z.boolean().refine((value) => value, {
      message: "You must accept telehealth consent to register.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function parseFieldValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function buildValidationState(error: z.ZodError): RegisterState {
  const fieldErrors: RegisterFieldErrors = {};

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

function isDuplicateAuthError(message: string): boolean {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("already registered") ||
    lowered.includes("already exists") ||
    lowered.includes("user already") ||
    lowered.includes("duplicate")
  );
}

function mapAuthErrorToState(message: string): RegisterState {
  const lowered = message.toLowerCase();

  if (isDuplicateAuthError(message)) {
    return {
      error: "An account with this email already exists. Please sign in instead.",
      fieldErrors: { email: "This email is already registered." },
    };
  }

  if (lowered.includes("network") || lowered.includes("fetch") || lowered.includes("timeout")) {
    return {
      error: "We could not reach the authentication service. Check your connection and try again.",
      fieldErrors: {},
    };
  }

  return {
    error: "We could not create your account right now. Please try again.",
    fieldErrors: {},
  };
}

async function findOrganizationVariant(
  admin: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
): Promise<{ exists: boolean; isInactive: boolean; variant: "snake" | "pascal" | null; error?: string }> {
  const snake = await admin
    .from("organizations")
    .select("id, status")
    .eq("id", organizationId)
    .maybeSingle();

  if (!snake.error) {
    return {
      exists: Boolean(snake.data),
      isInactive: Boolean(snake.data && "status" in snake.data && snake.data.status === "inactive"),
      variant: "snake",
    };
  }

  if (snake.error.code !== "PGRST205") {
    return {
      exists: false,
      isInactive: false,
      variant: null,
      error: snake.error.message,
    };
  }

  const pascal = await admin
    .from("Organizations")
    .select("id")
    .eq("id", organizationId)
    .maybeSingle();

  if (pascal.error) {
    return {
      exists: false,
      isInactive: false,
      variant: null,
      error: pascal.error.message,
    };
  }

  return {
    exists: Boolean(pascal.data),
    isInactive: false,
    variant: "pascal",
  };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Patient";
  const lastName = parts.slice(1).join(" ") || "User";
  return { firstName, lastName };
}

function buildMrn(organizationId: string): string {
  const compactOrg = organizationId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const randomSuffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `MRN-${compactOrg}-${randomSuffix}`;
}

async function cleanupAuthUser(admin: ReturnType<typeof createServiceRoleClient>, userId: string) {
  try {
    await admin.auth.admin.deleteUser(userId);
  } catch {
    // Best-effort rollback; avoid leaking secondary failure to UI.
  }
}

export async function signUpPatient(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    fullName: parseFieldValue(formData, "fullName"),
    email: parseFieldValue(formData, "email"),
    password: parseFieldValue(formData, "password"),
    confirmPassword: parseFieldValue(formData, "confirmPassword"),
    dob: parseFieldValue(formData, "dob"),
    sex: parseFieldValue(formData, "sex"),
    phone: parseFieldValue(formData, "phone"),
    organizationId: parseFieldValue(formData, "organizationId"),
    consentAccepted: formData.get("consentAccepted") === "on",
  });

  if (!parsed.success) {
    return buildValidationState(parsed.error);
  }

  const data = {
    ...parsed.data,
    dob: parsed.data.dob || null,
    sex: parsed.data.sex || null,
    phone: parsed.data.phone || null,
  };

  try {
    const supabase = await createClient();
    const admin = createServiceRoleClient();

    const orgCheck = await findOrganizationVariant(admin, data.organizationId);

    if (orgCheck.error) {
      return {
        error: "We could not validate the selected organization. Please try again.",
        fieldErrors: { organizationId: "Organization could not be validated." },
      };
    }

    if (!orgCheck.exists || orgCheck.isInactive) {
      return {
        error: "The selected organization is unavailable for patient registration.",
        fieldErrors: { organizationId: "Select an active organization." },
      };
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: "patient",
        },
      },
    });

    if (signUpError) {
      return mapAuthErrorToState(signUpError.message);
    }

    const userId = signUpData.user?.id;

    if (!userId) {
      return {
        error: "Account was created, but we could not finish setup. Please sign in to continue.",
        fieldErrors: {},
      };
    }

    if (orgCheck.variant === "snake") {
      const { error: profileError } = await admin.from("profiles").upsert(
        {
          id: userId,
          full_name: data.fullName,
          email: data.email,
          global_role: "patient",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        await cleanupAuthUser(admin, userId);
        return {
          error: "We created your login but could not save your profile. Please try again.",
          fieldErrors: {},
        };
      }

      const { error: membershipError } = await admin.from("memberships").upsert(
        {
          organization_id: data.organizationId,
          profile_id: userId,
          role: "patient",
          status: "active",
        },
        { onConflict: "organization_id,profile_id" },
      );

      if (membershipError) {
        await cleanupAuthUser(admin, userId);
        return {
          error: "Your account was created, but organization enrollment failed. Please retry.",
          fieldErrors: { organizationId: "Could not enroll in selected organization." },
        };
      }

      const now = new Date().toISOString();
      const existingPatient = await admin
        .from("patients")
        .select("id")
        .eq("organization_id", data.organizationId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (existingPatient.error && existingPatient.error.code !== "PGRST116") {
        await cleanupAuthUser(admin, userId);
        return {
          error: "Could not verify patient profile state. Please try again.",
          fieldErrors: {},
        };
      }

      let patientId = existingPatient.data?.id ?? null;

      if (patientId) {
        const { error: updatePatientError } = await admin
          .from("patients")
          .update({
            full_name: data.fullName,
            dob: data.dob,
            sex: data.sex,
            phone: data.phone,
            email: data.email,
            status: "active",
            intake_completed: true,
            intake_completed_at: now,
            consent_accepted_at: data.consentAccepted ? now : null,
          })
          .eq("id", patientId);

        if (updatePatientError) {
          await cleanupAuthUser(admin, userId);
          return {
            error: "Patient record setup failed. Please retry registration.",
            fieldErrors: {},
          };
        }
      } else {
        const { data: patientRecord, error: patientError } = await admin
          .from("patients")
          .insert({
            organization_id: data.organizationId,
            profile_id: userId,
            full_name: data.fullName,
            dob: data.dob,
            sex: data.sex,
            phone: data.phone,
            email: data.email,
            status: "active",
            intake_completed: true,
            intake_completed_at: now,
            consent_accepted_at: data.consentAccepted ? now : null,
          })
          .select("id")
          .single();

        if (patientError || !patientRecord) {
          await cleanupAuthUser(admin, userId);
          return {
            error: "Patient record setup failed. Please retry registration.",
            fieldErrors: {},
          };
        }

        patientId = patientRecord.id;
      }

      if (data.consentAccepted && patientId) {
        await admin.from("consents").insert({
          organization_id: data.organizationId,
          patient_id: patientId,
          consent_type: "telehealth",
          accepted: true,
          accepted_at: now,
          version: "v1",
        });
      }
    }

    if (orgCheck.variant === "pascal") {
      const { firstName, lastName } = splitName(data.fullName);

      const { error: userError } = await admin.from("Users").upsert(
        {
          id: userId,
          organization_id: data.organizationId,
          email: data.email,
          first_name: firstName,
          last_name: lastName,
          phone: data.phone,
          status: "active",
        },
        { onConflict: "id" },
      );

      if (userError) {
        await cleanupAuthUser(admin, userId);
        return {
          error: "We created your login but could not save your user profile. Please retry.",
          fieldErrors: {},
        };
      }

      const existingPatient = await admin
        .from("Patients")
        .select("id")
        .eq("organization_id", data.organizationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingPatient.error && existingPatient.error.code !== "PGRST116") {
        await cleanupAuthUser(admin, userId);
        return {
          error: "Could not verify patient profile state. Please try again.",
          fieldErrors: {},
        };
      }

      const patientPayload = {
        organization_id: data.organizationId,
        user_id: userId,
        mrn: buildMrn(data.organizationId),
        dob: data.dob,
        sex_at_birth: data.sex,
        phone: data.phone,
      };

      if (existingPatient.data?.id) {
        const { error: updatePatientError } = await admin
          .from("Patients")
          .update({
            dob: data.dob,
            sex_at_birth: data.sex,
            phone: data.phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPatient.data.id);

        if (updatePatientError) {
          await cleanupAuthUser(admin, userId);
          return {
            error: "Patient record setup failed. Please retry registration.",
            fieldErrors: {},
          };
        }
      } else {
        const { error: patientError } = await admin.from("Patients").insert(patientPayload);

        if (patientError) {
          await cleanupAuthUser(admin, userId);
          return {
            error: "Patient record setup failed. Please retry registration.",
            fieldErrors: {},
          };
        }
      }
    }

    // Registration must not auto-login. Trigger a verification email (best effort)
    // and always redirect to login for verified sign-in flow.
    const resend = await supabase.auth.resend({
      type: "signup",
      email: data.email,
    });

    await supabase.auth.signOut();

    const resendErrorMessage = resend.error?.message.toLowerCase() ?? "";
    const resendFailed = Boolean(resend.error) && !resendErrorMessage.includes("security purposes");

    const noticeParams = new URLSearchParams({
      verify_email: "1",
      email: data.email,
      ...(resendFailed ? { resend_failed: "1" } : {}),
    });

    redirect(`/login?${noticeParams.toString()}`);
  } catch {
    return {
      error: "Something went wrong while creating your account. Please try again.",
      fieldErrors: {},
    };
  }
}
