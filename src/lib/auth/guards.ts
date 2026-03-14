import { redirect } from "next/navigation";

import { getAuthContext, resolveMembership } from "@/lib/auth/context";
import type { AppRole, TenantContext } from "@/types/app";

export async function requireTenantContext(organizationSlug: string): Promise<TenantContext> {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  const membership = resolveMembership(context, organizationSlug);

  if (!membership) {
    redirect("/unauthorized");
  }

  return {
    profileId: context.userId,
    profileName: context.profileName,
    email: context.email,
    role: membership.role,
    organizationId: membership.organization.id,
    organizationSlug: membership.organization.slug,
    organizationName: membership.organization.name,
  };
}

export function requireRole(context: TenantContext, allowedRoles: AppRole[]) {
  if (!allowedRoles.includes(context.role)) {
    redirect("/unauthorized");
  }
}
