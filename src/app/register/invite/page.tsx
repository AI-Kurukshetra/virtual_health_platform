import Link from "next/link";

import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingInvitationByToken } from "@/lib/data/patient-invitations";

import { InviteRegisterForm } from "./invite-register-form";

export default async function InviteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  if (!token) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Invalid invitation link</CardTitle>
              <CardDescription>The link is missing required invitation data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" className="font-semibold text-sky-900 underline">
                Return to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicShell>
    );
  }

  let invitation: Awaited<ReturnType<typeof getPendingInvitationByToken>> = null;
  let loadError: string | null = null;

  try {
    invitation = await getPendingInvitationByToken(token);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load invitation.";
  }

  const invalidReason = invitation?.invalidReason ?? null;

  if (loadError || !invitation || invalidReason) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Invitation unavailable</CardTitle>
              <CardDescription>
                {loadError
                  ? loadError
                  : invalidReason === "expired"
                    ? "This invitation has expired. Ask your clinic for a new one."
                    : invalidReason === "already_processed"
                      ? "This invitation has already been used. Try signing in."
                      : invalidReason === "org_inactive"
                        ? "This organization is not accepting new registrations right now."
                        : "This invitation link is invalid."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" className="font-semibold text-sky-900 underline">
                Return to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete invitation registration</CardTitle>
            <CardDescription>
              Finish your patient setup for {invitation.organization.name}. Your organization assignment is automatic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteRegisterForm
              token={token}
              invitedEmail={invitation.invited_email}
              defaultFullName={invitation.invited_full_name ?? ""}
              organizationName={invitation.organization.name}
            />
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
