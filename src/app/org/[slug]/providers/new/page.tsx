import Link from "next/link";

import { ProviderAccountForm } from "@/components/forms/provider-account-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenantContext } from "@/lib/auth/guards";

export default async function NewProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);

  if (context.role !== "org_admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider creation unavailable</CardTitle>
          <CardDescription>Only organization admins can create provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <Link href={`/org/${slug}/providers`} className="text-sm font-semibold text-sky-900 underline">
          Back to providers
        </Link>
        <h2 className="text-2xl font-semibold text-slate-900">Add provider</h2>
        <p className="text-sm text-slate-600">
          Create a provider account with organization membership and initial profile details.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Provider account form</CardTitle>
          <CardDescription>
            The provider can sign in immediately after account creation with the configured credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderAccountForm organizationSlug={context.organizationSlug} />
        </CardContent>
      </Card>
    </section>
  );
}
