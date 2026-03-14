import Link from "next/link";

import { ProviderProfileForm } from "@/components/forms/provider-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenantContext } from "@/lib/auth/guards";
import { listProviderRoster } from "@/lib/data/providers";

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ slug: string; profileId: string }>;
}) {
  const { slug, profileId } = await params;
  const context = await requireTenantContext(slug);

  if (context.role !== "org_admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider edit unavailable</CardTitle>
          <CardDescription>Only organization admins can edit provider profiles.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const roster = await listProviderRoster(context.organizationId);
  const selectedProvider = roster.find((entry) => entry.profileId === profileId) ?? null;

  if (!selectedProvider) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider not found</CardTitle>
          <CardDescription>
            This provider membership is not part of the current organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/org/${slug}/providers`} className="text-sm font-semibold text-sky-900 underline">
            Back to providers
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <Link href={`/org/${slug}/providers`} className="text-sm font-semibold text-sky-900 underline">
          Back to providers
        </Link>
        <h2 className="text-2xl font-semibold text-slate-900">Edit provider</h2>
        <p className="text-sm text-slate-600">
          Update profile details for {selectedProvider.fullName}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{selectedProvider.fullName}</CardTitle>
          <CardDescription>
            Manage specialty, license, timezone, and bio for this provider profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderProfileForm
            key={`provider-edit-${selectedProvider.profileId}`}
            organizationSlug={context.organizationSlug}
            providerProfileId={selectedProvider.profileId}
            defaultValues={{
              specialty: selectedProvider.provider?.specialty,
              licenseNumber: selectedProvider.provider?.license_number,
              timezone: selectedProvider.provider?.timezone,
              bio: selectedProvider.provider?.bio,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
