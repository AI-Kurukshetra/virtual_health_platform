import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const carePillars = [
  "Patient onboarding with consent-ready intake",
  "Appointment lifecycle with role-safe routing",
  "Virtual consultation and documentation workflow",
  "Multi-tenant operations with Supabase policy controls",
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/auth/resolve");
  }

  return (
    <PublicShell>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-5 rounded-3xl border border-white/60 bg-white/65 p-7 shadow-xl shadow-sky-100/80 backdrop-blur-sm">
          <Badge variant="info">API-first EHR MVP</Badge>
          <h1 className="text-4xl font-semibold leading-tight text-sky-950 sm:text-5xl">
            Build virtual care journeys that clinicians trust and patients can actually use.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-sky-900/80">
            This platform is designed for modern digital health teams running onboarding, scheduling,
            tele-visits, charting, and secure role-based collaboration in one tenant-safe workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl bg-sky-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500"
            >
              Enter workspace
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center rounded-xl border border-sky-200 bg-white px-5 text-sm font-medium text-sky-900 transition hover:bg-sky-50"
            >
              Create patient account
            </Link>
          </div>
          <ul className="grid gap-2 text-sm text-sky-900/85 sm:grid-cols-2">
            {carePillars.map((pillar) => (
              <li key={pillar} className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2">
                {pillar}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demo credentials</CardTitle>
              <CardDescription>Use seeded users from `supabase/seed.sql`.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-sky-900/85">
              <p>
                <strong>Org admin:</strong> admin@virtualhealth.local
              </p>
              <p>
                <strong>Provider:</strong> provider@virtualhealth.local
              </p>
              <p>
                <strong>Patient:</strong> patient@virtualhealth.local
              </p>
              <p>
                <strong>Password:</strong> ChangeMe123!
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
            <CardHeader>
              <CardTitle className="text-white">MVP Focus Areas</CardTitle>
              <CardDescription className="text-cyan-100">
                Optimized for launch-stage virtual health organizations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-cyan-50">
              <p>1. Patient registration and onboarding</p>
              <p>2. Provider and patient dashboards</p>
              <p>3. Appointment operations and room access</p>
              <p>4. HIPAA-aware data boundaries with Supabase RLS</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
