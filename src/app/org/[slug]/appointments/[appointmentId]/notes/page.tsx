import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SoapNoteForm } from "@/components/forms/soap-note-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole, requireTenantContext } from "@/lib/auth/guards";
import { canEditSoapNote, formatAppointmentStatus } from "@/lib/data/appointments-shared";
import { getAppointmentDetail, getSoapNoteForAppointment } from "@/lib/data/appointments";
import { formatDateTimeInTimeZone } from "@/lib/timezone";

export default async function AppointmentNotesPage({
  params,
}: {
  params: Promise<{ slug: string; appointmentId: string }>;
}) {
  const { slug, appointmentId } = await params;
  const context = await requireTenantContext(slug);
  requireRole(context, ["org_admin", "provider"]);

  const [appointment, note] = await Promise.all([
    getAppointmentDetail(context.organizationId, appointmentId),
    getSoapNoteForAppointment(context.organizationId, appointmentId),
  ]);

  if (!appointment) {
    return <EmptyState>Appointment not found.</EmptyState>;
  }

  const appointmentStatus = appointment.status as
    | "scheduled"
    | "checked_in"
    | "in_progress"
    | "completed"
    | "cancelled";
  const noteSignedAt = note?.signed_at ?? appointment.note?.signed_at ?? null;
  const canSignNote = canEditSoapNote(context.role, appointmentStatus, noteSignedAt);
  const providerTimeZone = appointment.provider?.timezone ?? "UTC";

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">SOAP documentation</h2>
        <p className="text-sm text-slate-600">
          Complete encounter notes for {appointment.patient?.full_name ?? "patient"}.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Clinical note</CardTitle>
          <CardDescription>
            {noteSignedAt
              ? "Signed SOAP note for this completed encounter."
              : "Saving this form signs the note and updates appointment + encounter status."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {noteSignedAt ? (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">Signed</Badge>
                <p>
                  {formatDateTimeInTimeZone(noteSignedAt, providerTimeZone, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-slate-900">Subjective</p>
                  <p>{note?.subjective ?? "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Objective</p>
                  <p>{note?.objective ?? "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Assessment</p>
                  <p>{note?.assessment ?? "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Plan</p>
                  <p>{note?.plan ?? "-"}</p>
                </div>
              </div>
            </div>
          ) : canSignNote ? (
            <SoapNoteForm
              organizationSlug={context.organizationSlug}
              appointmentId={appointment.id}
              defaultValues={{
                subjective: note?.subjective,
                objective: note?.objective,
                assessment: note?.assessment,
                plan: note?.plan,
              }}
            />
          ) : (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                This appointment is currently <strong>{formatAppointmentStatus(appointmentStatus)}</strong>.
              </p>
              <p>SOAP notes become available only after the visit moves to in-progress.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
