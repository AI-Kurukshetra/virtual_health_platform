import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const valueHighlights = [
  {
    title: "Faster care access",
    description:
      "Patients move from onboarding to booked appointments with less friction, reducing drop-off in virtual care journeys.",
  },
  {
    title: "Higher clinical throughput",
    description:
      "Providers get structured scheduling and documentation flows that reduce operational overhead and improve visit efficiency.",
  },
  {
    title: "Safer multi-tenant operations",
    description:
      "Organizations can scale teams and patient volume with stronger tenant isolation and role-based governance controls.",
  },
  {
    title: "Better continuity of care",
    description:
      "Invitation-driven onboarding and provider-linked assignments keep care relationships connected from intake through follow-up.",
  },
];

const industryBenefits = [
  "Designed for digital health organizations, telehealth providers, and virtual-first clinics.",
  "Improves operational reliability for distributed care teams with compliance-aware workflows.",
  "Supports healthcare growth models where speed to launch and data governance both matter.",
  "Enables patient experience improvements while maintaining clinical and administrative visibility.",
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
          <Badge variant="info">Virtual Care Infrastructure</Badge>
          <h1 className="text-4xl font-semibold leading-tight text-sky-950 sm:text-5xl">
            Helping healthcare teams deliver connected, scalable, and more efficient virtual care.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-sky-900/80">
            This platform provides healthcare organizations with a stronger operational foundation for patient onboarding,
            provider workflows, and appointment execution across virtual-first care models.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl bg-sky-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500"
            >
              Access platform
            </Link>
          </div>
          <ul className="grid gap-3 text-sm text-sky-900/85">
            {industryBenefits.map((benefit) => (
              <li key={benefit} className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2">
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {valueHighlights.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
