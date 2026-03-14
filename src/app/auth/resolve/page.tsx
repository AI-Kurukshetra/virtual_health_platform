import { redirect } from "next/navigation";

import { getAuthContext, resolveMembership } from "@/lib/auth/context";

export default async function ResolveAuthPage() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  const membership = resolveMembership(context);

  if (!membership) {
    redirect("/onboarding");
  }

  redirect(`/org/${membership.organization.slug}/dashboard`);
}
