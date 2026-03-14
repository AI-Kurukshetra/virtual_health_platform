import Link from "next/link";
import { redirect } from "next/navigation";

import { DeletePatientButton } from "@/components/forms/delete-patient-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableCell, TableContainer, TableHeadCell } from "@/components/ui/table";
import { requireTenantContext } from "@/lib/auth/guards";
import { listActiveInvitationsForOrg } from "@/lib/data/patient-invitations";
import { getPatientByProfile, listPatients } from "@/lib/data/patients";

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);

  if (context.role === "patient") {
    const ownPatient = await getPatientByProfile(context.organizationId, context.profileId);

    if (!ownPatient) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Patient chart unavailable</CardTitle>
            <CardDescription>
              Your account is not linked to a patient record in this organization.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    redirect(`/org/${slug}/patients/${ownPatient.id}`);
  }

  const [patients, invitations] = await Promise.all([
    listPatients(context.organizationId),
    listActiveInvitationsForOrg(context.organizationId),
  ]);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-lg shadow-sky-100/70">
        <Badge variant="info">Patient Registry</Badge>
        <h2 className="mt-2 text-2xl font-semibold text-sky-950">Patients</h2>
        <p className="text-sm text-sky-800/80">
          Intake status, contact records, and chart access for the active organization.
        </p>
      </header>

      {patients.length ? (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Contact</TableHeadCell>
                <TableHeadCell>Intake</TableHeadCell>
                <TableHeadCell>Chart</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <TableCell>{patient.full_name}</TableCell>
                  <TableCell>{patient.email || patient.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={patient.intake_completed ? "success" : "warning"}>
                      {patient.intake_completed ? "Completed" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link className="font-semibold text-sky-900 underline" href={`/org/${slug}/patients/${patient.id}`}>
                      Open chart
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DeletePatientButton
                      organizationSlug={context.organizationSlug}
                      patientId={patient.id}
                      patientName={patient.full_name}
                    />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState>No patients are registered yet. Use the intake form to create the first record.</EmptyState>
      )}
      <Card className="bg-gradient-to-br from-cyan-50 to-sky-50">
        <CardHeader>
          <CardTitle>Next step</CardTitle>
          <CardDescription>
            Invite a patient by email or create a patient record directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            href={`/org/${slug}/patients/new`}
            className="inline-flex h-10 items-center rounded-xl bg-sky-600 px-4 text-sm font-medium text-white"
          >
            Open onboarding tools
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>Recent patient invites waiting for registration.</CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length ? (
            <ul className="space-y-2 text-sm text-sky-900">
              {invitations.map((invite) => (
                <li key={invite.id} className="rounded-xl border border-sky-100 bg-sky-50/45 px-3 py-2">
                  <p className="font-medium">{invite.invited_email}</p>
                  <p className="text-xs text-sky-800/80">
                    Expires: {new Date(invite.expires_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No active invitations.</EmptyState>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
