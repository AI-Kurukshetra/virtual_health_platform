import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext, resolveMembership } from "@/lib/auth/context";

export default async function OnboardingPage() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  const membership = resolveMembership(context);

  if (membership) {
    redirect(`/org/${membership.organization.slug}/dashboard`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12">
      <Card className="w-full bg-gradient-to-br from-white to-sky-50">
        <CardHeader>
          <CardTitle>Membership setup pending</CardTitle>
          <CardDescription>
            Your profile is active, but you are not yet linked to an organization tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-sky-900/85">
          <p>
            Ask an organization admin to assign your user to the correct workspace and role. Once membership is added,
            you will be redirected to your dashboard.
          </p>
          <div className="rounded-xl border border-sky-100 bg-white/85 p-4">
            <p className="font-medium text-sky-900">Recommended next actions</p>
            <p className="mt-1">1. Confirm your account email with the admin team.</p>
            <p>2. Request role assignment: patient, provider, or org admin.</p>
            <p>3. Return to sign in after the assignment is complete.</p>
          </div>
          <form action="/logout" method="post">
            <button type="submit" className="font-semibold text-sky-900 underline">
              Sign out
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
