import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/auth/resolve");
  }

  // Fetch organizations using service role (public page, no user session).
  // Support both schema variants used across environments:
  // - organizations(id, name, status)
  // - Organizations(id, name)
  const admin = createServiceRoleClient();
  const { data: activeOrganizations, error: activeOrganizationsError } = await admin
    .from("organizations")
    .select("id, name, status")
    .eq("status", "active")
    .order("name");

  let organizations = (activeOrganizations ?? []).map((org) => ({
    id: org.id,
    name: org.name,
  }));

  let organizationsLoadError = activeOrganizationsError?.message ?? null;

  // Fallback 1: same table without status filter.
  if (!organizations.length) {
    const { data: fallbackOrganizations, error: fallbackOrganizationsError } = await admin
      .from("organizations")
      .select("id, name, status")
      .order("name");

    organizations = (fallbackOrganizations ?? [])
      .filter((org) => !("status" in org) || org.status !== "inactive")
      .map((org) => ({ id: org.id, name: org.name }));

    if (fallbackOrganizationsError) {
      organizationsLoadError = fallbackOrganizationsError.message;
    }
  }

  // Fallback 2: legacy PascalCase table name.
  if (!organizations.length) {
    const { data: legacyOrganizations, error: legacyOrganizationsError } = await admin
      .from("Organizations")
      .select("id, name")
      .order("name");

    organizations = (legacyOrganizations ?? []).map((org) => ({
      id: org.id,
      name: org.name,
    }));

    if (legacyOrganizationsError) {
      organizationsLoadError = legacyOrganizationsError.message;
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Create a patient account</CardTitle>
            <CardDescription>
              Register to book virtual appointments, view your chart, and join
              video visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RegisterForm organizations={organizations} organizationsLoadError={organizationsLoadError} />
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-slate-900 underline hover:text-slate-700"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
