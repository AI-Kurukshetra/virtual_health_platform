import Link from "next/link";

import { updateAppointmentStatusAction } from "@/app/org/[slug]/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTenantContext } from "@/lib/auth/guards";
import { canEditSoapNote, getAllowedAppointmentStatusTransitions } from "@/lib/data/appointments-shared";
import { getAppointmentDetail } from "@/lib/data/appointments";
import { formatDateRangeInTimeZone } from "@/lib/timezone";

export default async function AppointmentRoomPage({
  params,
}: {
  params: Promise<{ slug: string; appointmentId: string }>;
}) {
  const { slug, appointmentId } = await params;
  const context = await requireTenantContext(slug);

  const appointment = await getAppointmentDetail(context.organizationId, appointmentId);

  if (!appointment) {
    return <EmptyState>Appointment room not found.</EmptyState>;
  }

  const availableTransitions = getAllowedAppointmentStatusTransitions(
    context.role,
    appointment.status as
      | "scheduled"
      | "checked_in"
      | "in_progress"
      | "completed"
      | "cancelled",
  );
  const canOpenSoapNote =
    context.role === "provider" || context.role === "org_admin";
  const canSignNote = canEditSoapNote(
    context.role,
    appointment.status as
      | "scheduled"
      | "checked_in"
      | "in_progress"
      | "completed"
      | "cancelled",
    appointment.note?.signed_at,
  );
  const providerTimeZone = appointment.provider?.timezone ?? "UTC";

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Virtual visit room</h2>
        <p className="text-sm text-slate-600">
          {formatDateRangeInTimeZone(
            appointment.scheduled_start,
            appointment.scheduled_end,
            providerTimeZone,
          )}{" "}
          - {appointment.patient?.full_name ?? "Patient"}
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Join visit</CardTitle>
          <CardDescription>
            Hosted meeting link fallback is used for MVP-safe virtual care delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>Current status: {appointment.status}</p>
          <p>Provider timezone: {providerTimeZone}</p>
          {appointment.meeting_url ? (
            <a
              href={appointment.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
            >
              Join meeting
            </a>
          ) : (
            <EmptyState>No meeting link configured for this appointment.</EmptyState>
          )}
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((status) => (
              <form action={updateAppointmentStatusAction} key={status}>
                <input type="hidden" name="organizationSlug" value={context.organizationSlug} />
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    status === "cancelled"
                      ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                      : status === "checked_in"
                        ? "border-blue-300 text-blue-700 hover:bg-blue-50"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {status === "checked_in"
                    ? "Check in"
                    : status === "in_progress"
                      ? "Start visit"
                      : `Set ${status.replace("_", " ")}`}
                </button>
              </form>
            ))}
          </div>
          {canOpenSoapNote ? (
            <Link href={`/org/${slug}/appointments/${appointment.id}/notes`} className="text-sm font-medium underline">
              {appointment.note?.signed_at ? "View signed SOAP note" : "Open SOAP notes shortcut"}
            </Link>
          ) : null}
          {canOpenSoapNote && !canSignNote ? (
            <p className="text-xs text-slate-600">
              {appointment.note?.signed_at
                ? "The signed note is available to review."
                : "Sign the SOAP note after the visit reaches in-progress."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
