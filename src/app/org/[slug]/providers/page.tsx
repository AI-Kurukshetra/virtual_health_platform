import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableCell, TableContainer, TableHeadCell } from "@/components/ui/table";
import { requireTenantContext } from "@/lib/auth/guards";
import { listProviderRoster } from "@/lib/data/providers";

export default async function ProvidersPage({
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
          <CardTitle>Providers section unavailable</CardTitle>
          <CardDescription>Only organization admins can manage provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const roster = await listProviderRoster(context.organizationId);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-lg shadow-sky-100/70">
        <div>
          <Badge variant="info">Provider Management</Badge>
          <h2 className="mt-2 text-2xl font-semibold text-sky-950">Providers</h2>
          <p className="text-sm text-sky-800/80">
            Manage provider accounts and profile readiness for this organization.
          </p>
        </div>
        <Link href={`/org/${slug}/providers/new`}>
          <Button>Add provider</Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Provider roster</CardTitle>
          <CardDescription>
            All provider accounts in this organization with core details and profile status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roster.length ? (
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Email</TableHeadCell>
                    <TableHeadCell>Specialty</TableHeadCell>
                    <TableHeadCell>License</TableHeadCell>
                    <TableHeadCell>Timezone</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((provider) => (
                    <tr key={provider.profileId}>
                      <TableCell>{provider.fullName}</TableCell>
                      <TableCell>{provider.email ?? "-"}</TableCell>
                      <TableCell>{provider.provider?.specialty ?? "-"}</TableCell>
                      <TableCell>{provider.provider?.license_number ?? "-"}</TableCell>
                      <TableCell>{provider.provider?.timezone ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={provider.provider ? "success" : "warning"}>
                          {provider.provider ? "Profile ready" : "Profile pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/org/${slug}/providers/${provider.profileId}/edit`}
                            className="text-xs font-semibold text-sky-900 underline"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/org/${slug}/providers/availability?provider=${provider.profileId}`}
                            className="text-xs font-semibold text-sky-900 underline"
                          >
                            Availability
                          </Link>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState>
              No providers have been added yet. Use the Add provider button to create the first provider account.
            </EmptyState>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
