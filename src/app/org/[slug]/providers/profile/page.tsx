import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderProfileForm } from "@/components/forms/provider-profile-form";
import { requireTenantContext } from "@/lib/auth/guards";
import { getProviderByProfile, listProviderRoster } from "@/lib/data/providers";

export default async function ProviderProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ provider?: string }>;
}) {
  const { slug } = await params;
  const { provider: selectedProviderProfileId } = await searchParams;
  const context = await requireTenantContext(slug);

  if (context.role !== "org_admin" && context.role !== "provider") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider profile unavailable</CardTitle>
          <CardDescription>This section is only for providers and org admins.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ownProvider = await getProviderByProfile(context.organizationId, context.profileId);
  const roster =
    context.role === "org_admin" ? await listProviderRoster(context.organizationId) : [];
  const fallbackProfileId = context.role === "org_admin" ? roster[0]?.profileId ?? null : context.profileId;
  const requestedProfileId =
    context.role === "org_admin"
      ? (selectedProviderProfileId && selectedProviderProfileId.length > 0
          ? selectedProviderProfileId
          : fallbackProfileId)
      : context.profileId;
  const selectedProviderEntry =
    context.role === "org_admin"
      ? roster.find((entry) => entry.profileId === requestedProfileId) ?? null
      : null;
  const targetProfileId =
    context.role === "org_admin"
      ? selectedProviderEntry?.profileId ?? fallbackProfileId
      : context.profileId;
  const resolvedProviderEntry =
    context.role === "org_admin"
      ? roster.find((entry) => entry.profileId === targetProfileId) ?? null
      : null;
  const targetProvider = context.role === "org_admin" ? resolvedProviderEntry?.provider ?? null : ownProvider;
  const targetName = resolvedProviderEntry?.fullName ?? context.profileName;

  if (context.role === "org_admin" && !targetProfileId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No provider memberships found</CardTitle>
          <CardDescription>Add a provider membership before configuring provider profile data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Provider profile</h2>
        <p className="text-sm text-slate-600">Configure specialty, credentials, timezone, and bio.</p>
      </header>
      {context.role === "org_admin" && roster.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Select provider</CardTitle>
            <CardDescription>Switch between provider memberships in this organization.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {roster.map((entry) => (
              <Link
                key={entry.profileId}
                href={`/org/${slug}/providers/profile?provider=${entry.profileId}`}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  entry.profileId === targetProfileId
                    ? "border-sky-300 bg-sky-50 text-sky-950"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {entry.fullName}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{targetProvider ? `Edit ${targetName}` : `Create ${targetName}'s profile`}</CardTitle>
          <CardDescription>
            A provider profile is required before adding weekly availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderProfileForm
            key={`provider-profile-${targetProfileId ?? "self"}`}
            organizationSlug={context.organizationSlug}
            providerProfileId={targetProfileId ?? undefined}
            defaultValues={{
              specialty: targetProvider?.specialty,
              licenseNumber: targetProvider?.license_number,
              timezone: targetProvider?.timezone,
              bio: targetProvider?.bio,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
