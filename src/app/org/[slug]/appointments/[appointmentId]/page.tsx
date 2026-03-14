import Link from "next/link";

import { updateAppointmentStatusAction } from "@/app/org/[slug]/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTenantContext } from "@/lib/auth/guards";
import {
  canEditSoapNote,
  formatAppointmentStatus,
  getAllowedAppointmentStatusTransitions,
  getAppointmentStatusBadgeVariant,
} from "@/lib/data/appointments-shared";
import { getAppointmentDetail } from "@/lib/data/appointments";
import { formatDateRangeInTimeZone } from "@/lib/timezone";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; appointmentId: string }>;
}) {
  const { slug, appointmentId } = await params;
  const context = await requireTenantContext(slug);

  const appointment = await getAppointmentDetail(context.organizationId, appointmentId);

  if (!appointment) {
    return <EmptyState>Appointment not found.</EmptyState>;
  }

  const providerProfile = Array.isArray(appointment.provider?.profile)
    ? appointment.provider?.profile[0]
    : appointment.provider?.profile;
  const providerTimeZone = appointment.provider?.timezone ?? "UTC";
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
    context.role === "org_admin" || context.role === "provider";
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

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">Appointment details</h2>
        <Badge
          variant={getAppointmentStatusBadgeVariant(
            appointment.status as
              | "scheduled"
              | "checked_in"
              | "in_progress"
              | "completed"
              | "cancelled",
          )}
        >
          {formatAppointmentStatus(
            appointment.status as
              | "scheduled"
              | "checked_in"
              | "in_progress"
              | "completed"
              | "cancelled",
          )}
        </Badge>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Visit metadata</CardTitle>
          <CardDescription>
            {formatDateRangeInTimeZone(
              appointment.scheduled_start,
              appointment.scheduled_end,
              providerTimeZone,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>Patient: {appointment.patient?.full_name ?? "-"}</p>
          <p>
            Provider: {providerProfile?.full_name ?? "-"}
            {appointment.provider?.specialty ? ` · ${appointment.provider.specialty}` : ""}
          </p>
          <p>Provider timezone: {providerTimeZone}</p>
          <p>Reason: {appointment.reason ?? "Not specified"}</p>
          <p>
            Meeting URL:{" "}
            {appointment.meeting_url ? (
              <a href={appointment.meeting_url} target="_blank" rel="noreferrer" className="underline">
                Join link
              </a>
            ) : (
              "Not set"
            )}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/org/${slug}/appointments/${appointment.id}/room`} className="text-sm font-medium underline">
              Open room
            </Link>
            {canOpenSoapNote ? (
              <Link href={`/org/${slug}/appointments/${appointment.id}/notes`} className="text-sm font-medium underline">
                {appointment.note?.signed_at ? "View signed SOAP note" : "SOAP note"}
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Status controls</CardTitle>
          <CardDescription>Update appointment state through the visit lifecycle.</CardDescription>
        </CardHeader>
        <CardContent>
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
                      : status === "in_progress"
                        ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Set {formatAppointmentStatus(status)}
                </button>
              </form>
            ))}
          </div>
          {canOpenSoapNote && !canSignNote ? (
            <p className="mt-3 text-xs text-slate-600">
              {appointment.note?.signed_at
                ? "This SOAP note has already been signed and is now read-only."
                : "SOAP notes can be signed only after the visit has started."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
