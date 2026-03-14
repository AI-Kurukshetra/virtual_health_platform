import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, TenantMembership } from "@/types/app";

export type AuthContext = {
  userId: string;
  email: string;
  profileName: string;
  globalRole: AppRole;
  memberships: TenantMembership[];
};

function inferRoleFromMetadata(metadata: unknown): AppRole {
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "role" in metadata &&
    typeof metadata.role === "string"
  ) {
    const role = metadata.role;
    if (role === "platform_admin" || role === "org_admin" || role === "provider" || role === "patient") {
      return role;
    }
  }

  return "patient";
}

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return null;
  }

  const inferredRole = inferRoleFromMetadata(user.user_metadata ?? user.app_metadata);
  const inferredName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email.split("@")[0] ?? "User";

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: inferredName,
      email: user.email,
      global_role: inferredRole,
    },
    { onConflict: "id" },
  );

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, global_role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("memberships")
      .select(
        "id, organization_id, profile_id, role, status, organization:organizations(id, name, slug, status)",
      )
      .eq("profile_id", user.id)
      .eq("status", "active"),
  ]);

  const mappedMemberships = (memberships ?? [])
    .map((membership) => {
      const organization = Array.isArray(membership.organization)
        ? membership.organization[0]
        : membership.organization;

      if (!organization) {
        return null;
      }

      return {
        id: membership.id,
        organization_id: membership.organization_id,
        profile_id: membership.profile_id,
        role: membership.role as AppRole,
        status: membership.status,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        },
      } as TenantMembership;
    })
    .filter((membership): membership is TenantMembership => membership !== null);

  return {
    userId: user.id,
    email: user.email,
    profileName: profile?.full_name ?? inferredName,
    globalRole: (profile?.global_role as AppRole | undefined) ?? inferredRole,
    memberships: mappedMemberships,
  };
});

export function resolveMembership(
  context: AuthContext,
  organizationSlug?: string,
): TenantMembership | null {
  if (!context.memberships.length) {
    return null;
  }

  if (!organizationSlug) {
    return context.memberships[0] ?? null;
  }

  return (
    context.memberships.find((membership) => membership.organization.slug === organizationSlug) ?? null
  );
}
