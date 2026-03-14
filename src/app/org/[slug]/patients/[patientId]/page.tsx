import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTenantContext } from "@/lib/auth/guards";
import { getPatientByProfile, getPatientChart } from "@/lib/data/patients";

export default async function PatientChartPage({
  params,
}: {
  params: Promise<{ slug: string; patientId: string }>;
}) {
  const { slug, patientId } = await params;
  const context = await requireTenantContext(slug);

  if (context.role === "patient") {
    const ownPatient = await getPatientByProfile(context.organizationId, context.profileId);

    if (!ownPatient || ownPatient.id !== patientId) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Chart not available</CardTitle>
            <CardDescription>You can only view your own chart.</CardDescription>
          </CardHeader>
        </Card>
      );
    }
  }

  const chart = await getPatientChart(context.organizationId, patientId);

  if (!chart.patient) {
    return <EmptyState>Patient record not found in this tenant.</EmptyState>;
  }

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{chart.patient.full_name}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>DOB: {chart.patient.dob ? format(new Date(chart.patient.dob), "PPP") : "-"}</span>
          <span>Sex: {chart.patient.sex ?? "-"}</span>
          <Badge variant={chart.patient.intake_completed ? "success" : "warning"}>
            {chart.patient.intake_completed ? "Intake completed" : "Intake pending"}
          </Badge>
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allergies</CardTitle>
          </CardHeader>
          <CardContent>
            {chart.allergies.length ? (
              <ul className="space-y-2 text-sm">
                {chart.allergies.map((allergy) => (
                  <li key={allergy.id} className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="font-medium text-slate-900">{allergy.allergen}</p>
                    <p className="text-slate-600">
                      {allergy.reaction ?? "No reaction listed"} · {allergy.severity ?? "severity not set"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No allergies recorded.</EmptyState>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Medications</CardTitle>
          </CardHeader>
          <CardContent>
            {chart.medications.length ? (
              <ul className="space-y-2 text-sm">
                {chart.medications.map((medication) => (
                  <li key={medication.id} className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="font-medium text-slate-900">{medication.medication_name}</p>
                    <p className="text-slate-600">
                      {medication.dose ?? "dose not set"} · {medication.frequency ?? "frequency not set"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No medications recorded.</EmptyState>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Clinical notes</CardTitle>
          <CardDescription>Signed SOAP notes appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {chart.notes.length ? (
            <ul className="space-y-3">
              {chart.notes.map((note) => (
                <li key={note.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">
                    Signed {note.signed_at ? format(new Date(note.signed_at), "PPpp") : "draft"}
                  </p>
                  <p className="mt-2 text-slate-700">
                    <strong>Assessment:</strong> {note.assessment || "-"}
                  </p>
                  <p className="text-slate-700">
                    <strong>Plan:</strong> {note.plan || "-"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No SOAP notes have been signed for this patient yet.</EmptyState>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
