import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientInviteForm } from "@/components/forms/patient-invite-form";
import { PatientIntakeForm } from "@/components/forms/patient-intake-form";
import { requireRole, requireTenantContext } from "@/lib/auth/guards";
import { listProviderRoster } from "@/lib/data/providers";

export default async function NewPatientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);
  requireRole(context, ["org_admin", "provider"]);
  const providerRoster = await listProviderRoster(context.organizationId);
  const providerOptions = providerRoster.map((provider) => ({
    profileId: provider.profileId,
    label: provider.email ? `${provider.fullName} (${provider.email})` : provider.fullName,
  }));

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Patient onboarding</h2>
        <p className="text-sm text-slate-600">
          Invite a patient by email or create the patient record directly.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite by email</CardTitle>
            <CardDescription>
              Send a secure invitation link. The patient will complete registration with automatic
              organization assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PatientInviteForm
              organizationSlug={context.organizationSlug}
              providerOptions={providerOptions}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create patient directly</CardTitle>
            <CardDescription>For walk-in or staff-assisted onboarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientIntakeForm
              organizationSlug={context.organizationSlug}
              providerOptions={providerOptions}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recommended workflow</CardTitle>
          <CardDescription>Use invitations when possible for secure self-service registration.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          Invitation links expire automatically and are bound to one organization. Patients who complete
          invite registration can sign in and book appointments from their dashboard.
        </CardContent>
      </Card>
    </section>
  );
}
