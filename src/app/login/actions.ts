"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export type LoginState = {
  error: string | null;
  requiresEmailVerification?: boolean;
  submittedEmail?: string;
};

export type ResendVerificationState = {
  error: string | null;
  success: string | null;
};

function normalizeErrorMessage(message: string): string {
  return message.toLowerCase();
}

export async function signInWithPassword(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      const msg = normalizeErrorMessage(error.message);

      if (msg.includes("email") && msg.includes("confirm")) {
        return {
          error: "Please verify your email before logging in.",
          requiresEmailVerification: true,
          submittedEmail: parsed.data.email,
        };
      }

      if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
        return {
          error: "Invalid email or password. If you don’t have an account yet, register as a new patient.",
          submittedEmail: parsed.data.email,
        };
      }

      if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("timeout")) {
        return {
          error: "Network issue while signing in. Check your connection and retry.",
          submittedEmail: parsed.data.email,
        };
      }

      return {
        error: "Unable to sign in right now. Please try again.",
        submittedEmail: parsed.data.email,
      };
    }

    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      return {
        error: "Please verify your email before logging in.",
        requiresEmailVerification: true,
        submittedEmail: parsed.data.email,
      };
    }
  } catch {
    return {
      error: "Unexpected error during sign in. Please try again.",
      submittedEmail: parsed.data.email,
    };
  }

  redirect("/auth/resolve");
}

export async function resendVerificationEmail(
  _previousState: ResendVerificationState,
  formData: FormData,
): Promise<ResendVerificationState> {
  const parsed = resendSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email to resend verification.", success: null };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
    });

    if (error) {
      const msg = normalizeErrorMessage(error.message);

      if (msg.includes("security purposes") || msg.includes("rate limit") || msg.includes("too many requests")) {
        return {
          error:
            "A verification email was sent recently. Please wait a minute and check your inbox/spam folder.",
          success: null,
        };
      }

      if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("timeout")) {
        return {
          error: "Could not reach the email service. Please check your connection and try again.",
          success: null,
        };
      }

      return {
        error: "We couldn't resend verification right now. Please try again shortly.",
        success: null,
      };
    }

    return {
      error: null,
      success: "Verification email sent. Please check your inbox and spam folder.",
    };
  } catch {
    return {
      error: "Unexpected error while resending verification email.",
      success: null,
    };
  }
}
