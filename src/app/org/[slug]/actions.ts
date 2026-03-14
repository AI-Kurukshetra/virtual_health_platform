"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole, requireTenantContext } from "@/lib/auth/guards";
import {
  createAppointmentWithChecks,
  saveSoapNote,
  updateAppointmentStatus,
} from "@/lib/data/appointments";
import { getPatientByProfile, createPatientRecord } from "@/lib/data/patients";
import {
  assignPatientToProvider,
  createPatientInvitation,
} from "@/lib/data/patient-invitations";
import {
  addAvailabilityEntry,
  createProviderAccount,
  deleteAvailabilityEntry,
  getProviderByProfile,
  getProviderByProfileId,
  upsertProviderProfile,
} from "@/lib/data/providers";
import type { AppointmentStatus } from "@/types/app";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ActionState = {
  error: string | null;
  success: string | null;
  invitationLink?: string | null;
};

const initialActionState: ActionState = {
  error: null,
  success: null,
  invitationLink: null,
};

function isValidTimeZone(value: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function asNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseSlug(formData: FormData) {
  const slug = formData.get("organizationSlug");

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("Missing organization context.");
  }

  return slug;
}

function normalizeOptionalProviderProfileId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (
    trimmed.length === 0 ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return null;
  }

  return trimmed;
}

const patientSchema = z.object({
  fullName: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(2, "Full name must be at least 2 characters."),
  ),
  dob: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().optional(),
  ),
  sex: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : ""),
    z.enum(["", "female", "male", "other", "prefer_not_to_say"]).optional(),
  ),
  phone: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z
      .string()
      .refine((value) => value.length === 0 || /^[0-9+()\-\s]{7,20}$/.test(value), {
        message: "Enter a valid phone number.",
      })
      .optional(),
  ),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : ""),
    z
      .string()
      .refine((value) => value.length === 0 || z.string().email().safeParse(value).success, {
        message: "Enter a valid email address.",
      })
      .optional(),
  ),
  intakeCompleted: z.boolean(),
  consentAccepted: z.boolean(),
  providerProfileId: z.any().optional(),
});

export async function createPatientIntakeAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const slug = parseSlug(formData);
    const context = await requireTenantContext(slug);
    requireRole(context, ["org_admin", "provider"]);

    const parsed = patientSchema.safeParse({
      fullName: formData.get("fullName"),
      dob: formData.get("dob")?.toString() ?? undefined,
      sex: formData.get("sex")?.toString() ?? undefined,
      phone: formData.get("phone")?.toString() ?? undefined,
      email: formData.get("email")?.toString() ?? undefined,
      intakeCompleted: formData.get("intakeCompleted") === "on",
      consentAccepted: formData.get("consentAccepted") === "on",
      providerProfileId: formData.get("providerProfileId")?.toString() ?? undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(" ");
      return { error: message || "Please provide valid intake details.", success: null };
    }

    const patientId = await createPatientRecord({
      organizationId: context.organizationId,
      actorProfileId: context.profileId,
      fullName: parsed.data.fullName,
      dob: parsed.data.dob ? parsed.data.dob : null,
      sex: parsed.data.sex ? parsed.data.sex : null,
      phone: parsed.data.phone ? parsed.data.phone : null,
      email: parsed.data.email ? parsed.data.email : null,
      intakeCompleted: parsed.data.intakeCompleted,
      consentAccepted: parsed.data.consentAccepted,
    });

    const requestedProviderProfileId = normalizeOptionalProviderProfileId(parsed.data.providerProfileId);

    const providerProfileIdToAssign =
      context.role === "provider" ? context.profileId : requestedProviderProfileId;

    if (providerProfileIdToAssign) {
      const provider = await getProviderByProfileId(context.organizationId, providerProfileIdToAssign);
      if (provider) {
        await assignPatientToProvider({
          organizationId: context.organizationId,
          patientId,
          providerId: provider.id,
          assignedByProfileId: context.profileId,
        });
      }
    }

    revalidatePath(`/org/${slug}/patients`);
    revalidatePath(`/org/${slug}/dashboard`);

    return { error: null, success: "Patient intake saved.", invitationLink: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save patient intake.",
      success: null,
      invitationLink: null,
    };
  }
}

const invitePatientSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : ""),
    z.string().email("Enter a valid patient email."),
  ),
  fullName: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z
      .string()
      .refine((value) => value.length === 0 || (value.length >= 2 && value.length <= 100), {
        message: "Patient name must be 2-100 characters if provided.",
      })
      .optional(),
  ),
  providerProfileId: z.any().optional(),
});

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

export async function invitePatientAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const slug = parseSlug(formData);
    const context = await requireTenantContext(slug);
    requireRole(context, ["org_admin", "provider"]);

    const parsed = invitePatientSchema.safeParse({
      email: formData.get("email"),
      fullName: formData.get("fullName")?.toString() ?? undefined,
      providerProfileId: formData.get("providerProfileId")?.toString() ?? undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(" ");
      return { error: message || "Enter a valid email and patient name.", success: null, invitationLink: null };
    }

    const providerProfileIdFromForm = normalizeOptionalProviderProfileId(parsed.data.providerProfileId);
    const providerProfileId =
      context.role === "provider" ? context.profileId : providerProfileIdFromForm;

    if (providerProfileId) {
      const provider = await getProviderByProfileId(context.organizationId, providerProfileId);
      if (!provider) {
        return {
          error: "Selected provider is not active in this organization.",
          success: null,
          invitationLink: null,
        };
      }
    }

    const invitation = await createPatientInvitation({
      organizationId: context.organizationId,
      invitedEmail: parsed.data.email,
      invitedFullName:
        parsed.data.fullName && parsed.data.fullName.length > 0 ? parsed.data.fullName : null,
      invitedByProfileId: context.profileId,
      invitedByRole: context.role === "provider" ? "provider" : "org_admin",
      providerProfileId,
    });

    const invitationLink = `${getAppBaseUrl()}/register/invite?token=${encodeURIComponent(invitation.token)}`;
    const admin = createServiceRoleClient();
    const { error: inviteEmailError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      redirectTo: invitationLink,
      data: {
        role: "patient",
      },
    });

    revalidatePath(`/org/${slug}/patients`);

    if (inviteEmailError) {
      return {
        error:
          "Invitation created, but email delivery failed. Copy the invitation link and share it manually.",
        success: null,
        invitationLink,
      };
    }

    return {
      error: null,
      success: "Invitation sent. The patient will receive a secure registration email link.",
      invitationLink,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to send invitation.",
      success: null,
      invitationLink: null,
    };
  }
}

const providerProfileSchema = z.object({
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  timezone: z.string().trim().min(1).refine(isValidTimeZone, {
    message: "Enter a valid IANA timezone.",
  }),
  bio: z.string().optional(),
});

const providerAccountSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
    specialty: z.string().optional(),
    licenseNumber: z.string().optional(),
    timezone: z.string().trim().min(1).refine(isValidTimeZone, {
      message: "Enter a valid IANA timezone.",
    }),
    bio: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function createProviderAccountAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const slug = parseSlug(formData);
    const context = await requireTenantContext(slug);
    requireRole(context, ["org_admin"]);

    const parsed = providerAccountSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      specialty: formData.get("specialty")?.toString() ?? undefined,
      licenseNumber: formData.get("licenseNumber")?.toString() ?? undefined,
      timezone: formData.get("timezone"),
      bio: formData.get("bio")?.toString() ?? undefined,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Provide valid provider account details.", success: null };
    }

    await createProviderAccount({
      organizationId: context.organizationId,
      actorProfileId: context.profileId,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      password: parsed.data.password,
      specialty: parsed.data.specialty?.trim() || null,
      licenseNumber: parsed.data.licenseNumber?.trim() || null,
      timezone: parsed.data.timezone,
      bio: parsed.data.bio?.trim() || null,
    });

    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/providers/profile`);
    revalidatePath(`/org/${slug}/providers/availability`);
    revalidatePath(`/org/${slug}/patients/new`);
    revalidatePath(`/org/${slug}/appointments/book`);

    return {
      error: null,
      success: "Provider account created. The provider can sign in with the email and password entered here.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create provider account.",
      success: null,
    };
  }
}

export async function saveProviderProfileAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const slug = parseSlug(formData);
    const context = await requireTenantContext(slug);

    if (context.role !== "org_admin" && context.role !== "provider") {
      return { error: "Unauthorized role for provider profile updates.", success: null };
    }

    const parsed = providerProfileSchema.safeParse({
      specialty: formData.get("specialty")?.toString() ?? undefined,
      licenseNumber: formData.get("licenseNumber")?.toString() ?? undefined,
      timezone: formData.get("timezone")?.toString() ?? "UTC",
      bio: formData.get("bio")?.toString() ?? undefined,
    });

    if (!parsed.success) {
      return { error: "Provide valid provider profile fields.", success: null };
    }

    const explicitProfileId = asNullableString(formData.get("providerProfileId"));
    const targetProfileId =
      context.role === "org_admin" && explicitProfileId ? explicitProfileId : context.profileId;

    await upsertProviderProfile({
      organizationId: context.organizationId,
      profileId: targetProfileId,
      specialty: parsed.data.specialty?.trim() || null,
      licenseNumber: parsed.data.licenseNumber?.trim() || null,
      timezone: parsed.data.timezone,
      bio: parsed.data.bio?.trim() || null,
    });

    revalidatePath(`/org/${slug}/providers/profile`);
    revalidatePath(`/org/${slug}/providers/availability`);
    revalidatePath(`/org/${slug}/appointments/book`);

    return { error: null, success: "Provider profile updated." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save provider profile.",
      success: null,
    };
  }
}

const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.coerce.number().int().min(15).max(120),
});

export async function addAvailabilityAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const slug = parseSlug(formData);
    const context = await requireTenantContext(slug);

    if (context.role !== "org_admin" && context.role !== "provider") {
      return { error: "Unauthorized role for availability updates.", success: null };
    }

    const parsed = availabilitySchema.safeParse({
      dayOfWeek: formData.get("dayOfWeek"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      slotMinutes: formData.get("slotMinutes"),
    });

    if (!parsed.success) {
      return { error: "Provide a valid availability window.", success: null };
    }

    const explicitProviderId = asNullableString(formData.get("providerId"));

    let providerId = explicitProviderId;

    if (!providerId) {
      const provider = await getProviderByProfile(context.organizationId, context.profileId);
      providerId = provider?.id ?? null;
    }

    if (!providerId) {
      return { error: "Provider profile is required before setting availability.", success: null };
    }

    await addAvailabilityEntry({
      organizationId: context.organizationId,
      providerId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      slotMinutes: parsed.data.slotMinutes,
    });

    revalidatePath(`/org/${slug}/providers/availability`);
    revalidatePath(`/org/${slug}/appointments/book`);

    return { error: null, success: "Availability saved." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save availability.",
      success: null,
    };
  }
}

export async function deleteAvailabilityAction(formData: FormData) {
  const slug = parseSlug(formData);
  const context = await requireTenantContext(slug);

  if (context.role !== "org_admin" && context.role !== "provider") {
    throw new Error("Unauthorized role for availability deletion.");
  }

  const availabilityId = asNullableString(formData.get("availabilityId"));

  if (!availabilityId) {
    throw new Error("Missing availability id.");
  }

  await deleteAvailabilityEntry(context.organizationId, availabilityId);

  revalidatePath(`/org/${slug}/providers/availability`);
  revalidatePath(`/org/${slug}/appointments/book`);
}

const bookingSchema = z.object({
  providerId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  reason: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  patientId: z.string().uuid().optional().or(z.literal("")),
});

export async function bookAppointmentAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const slug = parseSlug(formData);
    const context = await requireTenantContext(slug);
    requireRole(context, ["patient"]);

    const parsed = bookingSchema.safeParse({
      providerId: formData.get("providerId"),
      scheduledStart: formData.get("scheduledStart"),
      scheduledEnd: formData.get("scheduledEnd"),
      reason: formData.get("reason")?.toString() ?? undefined,
      meetingUrl: formData.get("meetingUrl")?.toString() ?? undefined,
      patientId: formData.get("patientId")?.toString() ?? undefined,
    });

    if (!parsed.success) {
      return { error: "Invalid booking payload.", success: null };
    }

    let patientId = parsed.data.patientId && parsed.data.patientId.length > 0 ? parsed.data.patientId : null;

    if (!patientId) {
      const patient = await getPatientByProfile(context.organizationId, context.profileId);
      patientId = patient?.id ?? null;
    }

    if (!patientId) {
      return { error: "A patient profile is required before booking.", success: null };
    }

    await createAppointmentWithChecks({
      organizationId: context.organizationId,
      actorProfileId: context.profileId,
      patientId,
      providerId: parsed.data.providerId,
      scheduledStart: parsed.data.scheduledStart,
      scheduledEnd: parsed.data.scheduledEnd,
      reason: parsed.data.reason?.trim() ?? null,
      meetingUrl:
        parsed.data.meetingUrl && parsed.data.meetingUrl.length > 0
          ? parsed.data.meetingUrl
          : `https://meet.jit.si/${slug}-${Date.now()}`,
    });

    revalidatePath(`/org/${slug}/appointments`);
    revalidatePath(`/org/${slug}/dashboard`);

    return { error: null, success: "Appointment booked successfully." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to book appointment.",
      success: null,
    };
  }
}

const statusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["scheduled", "checked_in", "in_progress", "completed", "cancelled"]),
});

export async function updateAppointmentStatusAction(formData: FormData) {
  const slug = parseSlug(formData);
  const context = await requireTenantContext(slug);

  const parsed = statusSchema.parse({
    appointmentId: formData.get("appointmentId"),
    status: formData.get("status"),
  });

  if (
    context.role === "patient" &&
    !["checked_in", "cancelled"].includes(parsed.status as AppointmentStatus)
  ) {
    throw new Error("Patients can only check in or cancel appointments.");
  }

  await updateAppointmentStatus({
    organizationId: context.organizationId,
    actorProfileId: context.profileId,
    actorRole: context.role,
    appointmentId: parsed.appointmentId,
    status: parsed.status,
  });

  revalidatePath(`/org/${slug}/appointments`);
  revalidatePath(`/org/${slug}/appointments/${parsed.appointmentId}`);
  revalidatePath(`/org/${slug}/appointments/${parsed.appointmentId}/room`);
  revalidatePath(`/org/${slug}/appointments/${parsed.appointmentId}/notes`);
  revalidatePath(`/org/${slug}/dashboard`);
}

const soapSchema = z.object({
  appointmentId: z.string().uuid(),
  subjective: z.string().min(2),
  objective: z.string().min(2),
  assessment: z.string().min(2),
  plan: z.string().min(2),
});

export async function saveSoapNoteAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const slug = parseSlug(formData);
    const context = await requireTenantContext(slug);
    requireRole(context, ["org_admin", "provider"]);

    const parsed = soapSchema.safeParse({
      appointmentId: formData.get("appointmentId"),
      subjective: formData.get("subjective"),
      objective: formData.get("objective"),
      assessment: formData.get("assessment"),
      plan: formData.get("plan"),
    });

    if (!parsed.success) {
      return { error: "All SOAP sections are required.", success: null };
    }

    await saveSoapNote({
      organizationId: context.organizationId,
      actorProfileId: context.profileId,
      appointmentId: parsed.data.appointmentId,
      subjective: parsed.data.subjective,
      objective: parsed.data.objective,
      assessment: parsed.data.assessment,
      plan: parsed.data.plan,
    });

    revalidatePath(`/org/${slug}/appointments/${parsed.data.appointmentId}`);
    revalidatePath(`/org/${slug}/appointments/${parsed.data.appointmentId}/notes`);
    revalidatePath(`/org/${slug}/appointments/${parsed.data.appointmentId}/room`);
    revalidatePath(`/org/${slug}/patients`);
    revalidatePath(`/org/${slug}/dashboard`);

    return { error: null, success: "SOAP note saved and signed." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save SOAP note.",
      success: null,
    };
  }
}
