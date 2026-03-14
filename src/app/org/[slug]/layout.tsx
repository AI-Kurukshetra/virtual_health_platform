import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getRoleNavigation } from "@/lib/auth/navigation";
import { requireTenantContext } from "@/lib/auth/guards";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);

  return (
    <AppShell
      orgName={context.organizationName}
      roleLabel={context.role.replace("_", " ")}
      navItems={getRoleNavigation(context.role, context.organizationSlug)}
    >
      {children}
    </AppShell>
  );
}
