import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderProfileForm } from "@/components/forms/provider-profile-form";
import { requireTenantContext } from "@/lib/auth/guards";
import { getProviderByProfile } from "@/lib/data/providers";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);

  if (context.role === "org_admin") {
    redirect(`/org/${slug}/providers`);
  }

  if (context.role !== "provider") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider profile unavailable</CardTitle>
          <CardDescription>This section is only for provider users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ownProvider = await getProviderByProfile(context.organizationId, context.profileId);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">My provider profile</h2>
        <p className="text-sm text-slate-600">Configure specialty, credentials, timezone, and bio.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>{ownProvider ? "Edit profile" : "Create profile"}</CardTitle>
          <CardDescription>
            A provider profile is required before adding weekly availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderProfileForm
            key={`provider-profile-self-${context.profileId}`}
            organizationSlug={context.organizationSlug}
            providerProfileId={context.profileId}
            defaultValues={{
              specialty: ownProvider?.specialty,
              licenseNumber: ownProvider?.license_number,
              timezone: ownProvider?.timezone,
              bio: ownProvider?.bio,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
