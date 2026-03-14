import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/auth/resolve");
  }

  const verifyEmail = params.verify_email === "1";
  const resendFailed = params.resend_failed === "1";
  const prefilledEmail =
    typeof params.email === "string" && params.email.includes("@") ? params.email : null;

  const notice = verifyEmail
    ? resendFailed
      ? "Registration complete. We could not confirm email delivery, so please use 'Resend verification email' below before logging in."
      : "Registration complete. Please verify your email before logging in."
    : null;

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-gradient-to-br from-sky-600 to-cyan-600 text-white">
          <CardHeader>
            <Badge className="w-fit bg-white/20 text-white">Secure Sign-In</Badge>
            <CardTitle className="text-white">Access your care operations workspace</CardTitle>
            <CardDescription className="text-cyan-100">
              Continue as org admin, provider, or patient to manage onboarding, visits, and documentation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-cyan-50">
            <p>Role-aware routing sends each user to the correct tenant dashboard.</p>
            <p>Session checks and organization membership validation run before protected access.</p>
            <p>Email verification is required for patient account security.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your email and password to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm notice={notice} prefilledEmail={prefilledEmail} />
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
