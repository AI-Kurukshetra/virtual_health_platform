import Link from "next/link";

import { ProviderAccountForm } from "@/components/forms/provider-account-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTenantContext } from "@/lib/auth/guards";
import { formatAppointmentStatus, getAppointmentStatusBadgeVariant } from "@/lib/data/appointments-shared";
import {
  getAdminDashboardData,
  getPatientDashboardData,
  getProviderDashboardData,
} from "@/lib/data/dashboard";
import { listProviderRoster } from "@/lib/data/providers";
import { formatDateRangeInTimeZone, formatDateTimeInTimeZone } from "@/lib/timezone";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);

  if (context.role === "org_admin") {
    const [data, providerRoster] = await Promise.all([
      getAdminDashboardData(context.organizationId),
      listProviderRoster(context.organizationId),
    ]);

    return (
      <section className="space-y-6">
        <header className="rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-lg shadow-sky-100/70">
          <Badge variant="info">Admin Control Center</Badge>
          <h2 className="mt-2 text-2xl font-semibold text-sky-950">Organization operations overview</h2>
          <p className="text-sm text-sky-800/80">
            Monitor tenant growth, clinical capacity, and appointment volume for this virtual health workspace.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-sky-50 to-sky-100/60">
            <CardHeader>
              <CardDescription>Total patients</CardDescription>
              <CardTitle className="text-3xl">{data.patientCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/60">
            <CardHeader>
              <CardDescription>Total providers</CardDescription>
              <CardTitle className="text-3xl">{data.providerCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/70">
            <CardHeader>
              <CardDescription>Total appointments</CardDescription>
              <CardTitle className="text-3xl">{data.appointmentCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Create provider</CardTitle>
              <CardDescription>
                Add a provider login, organization membership, and provider profile in one step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderAccountForm organizationSlug={context.organizationSlug} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Provider roster</CardTitle>
              <CardDescription>
                Active provider accounts in this organization. New providers appear here immediately after creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providerRoster.length ? (
                <div className="space-y-3">
                  {providerRoster.map((provider) => (
                    <article
                      key={provider.profileId}
                      className="space-y-2 rounded-xl border border-sky-100 bg-sky-50/45 px-3 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-sky-950">{provider.fullName}</p>
                          <p className="text-xs text-sky-800/80">{provider.email ?? "No email on file"}</p>
                        </div>
                        <Badge variant={provider.provider ? "success" : "warning"}>
                          {provider.provider ? "Profile ready" : "Profile pending"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600">
                        <p>Specialty: {provider.provider?.specialty ?? "Not set"}</p>
                        <p>Timezone: {provider.provider?.timezone ?? "Not set"}</p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs font-semibold text-sky-900">
                        <Link
                          href={`/org/${slug}/providers/profile?provider=${provider.profileId}`}
                          className="underline"
                        >
                          Open profile
                        </Link>
                        <Link
                          href={`/org/${slug}/providers/availability?provider=${provider.profileId}`}
                          className="underline"
                        >
                          Manage availability
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState>No providers have been added to this organization yet.</EmptyState>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (context.role === "provider") {
    const data = await getProviderDashboardData(context.organizationId, context.profileId);

    return (
      <section className="space-y-6">
        <header className="rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-lg shadow-sky-100/70">
          <Badge variant="success">Provider Workflow</Badge>
          <h2 className="mt-2 text-2xl font-semibold text-sky-950">Clinical dayboard and documentation queue</h2>
          <p className="text-sm text-sky-800/80">
            Prioritize visits, track encounter status, and close notes with clear handoff visibility.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-emerald-50 to-cyan-50">
            <CardHeader>
              <CardTitle>Pending notes</CardTitle>
              <CardDescription>Open encounters that still need provider documentation.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-emerald-700">{data.pendingNotesCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-sky-50 to-indigo-50">
            <CardHeader>
              <CardTitle>Today&apos;s schedule</CardTitle>
              <CardDescription>
                {data.todayAppointments.length} patient visit{data.todayAppointments.length === 1 ? "" : "s"} in queue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/org/${slug}/appointments`} className="text-sm font-semibold text-sky-900 underline">
                Open full appointment board
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s appointments</CardTitle>
            <CardDescription>Ordered by start time for clinical flow.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.todayAppointments.length ? (
              <div className="space-y-3">
                {data.todayAppointments.map((appointment) => {
                  const patient = Array.isArray(appointment.patient)
                    ? appointment.patient[0]
                    : appointment.patient;

                  return (
                    <article
                      key={appointment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/45 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-sky-950">
                          {formatDateTimeInTimeZone(appointment.scheduled_start, data.timeZone ?? undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {patient?.full_name ?? "Patient"}
                        </p>
                        <p className="text-xs text-sky-800/75">{appointment.reason ?? "No reason specified"}</p>
                      </div>
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
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState>No appointments are scheduled for today.</EmptyState>
            )}
          </CardContent>
        </Card>
      </section>
    );
  }

  const data = await getPatientDashboardData(context.organizationId, context.profileId);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-lg shadow-sky-100/70">
        <Badge variant="info">Patient Portal</Badge>
        <h2 className="mt-2 text-2xl font-semibold text-sky-950">Your care timeline at a glance</h2>
        <p className="text-sm text-sky-800/80">
          Stay on top of upcoming visits, virtual room links, and your latest chart highlights.
        </p>
      </header>
      <Card className="bg-gradient-to-br from-sky-50 to-cyan-50">
        <CardHeader>
          <CardTitle>Upcoming appointment</CardTitle>
          <CardDescription>
            {data.upcomingAppointment
              ? `Next visit on ${formatDateRangeInTimeZone(
                  data.upcomingAppointment.scheduled_start,
                  data.upcomingAppointment.scheduled_end,
                  data.upcomingAppointment.provider?.timezone ?? "UTC",
                )}`
              : "No upcoming appointments."}
          </CardDescription>
        </CardHeader>
        {data.upcomingAppointment ? (
          <CardContent className="space-y-2 text-sm text-sky-900/85">
            <p>
              Status:{" "}
              {formatAppointmentStatus(
                data.upcomingAppointment.status as
                  | "scheduled"
                  | "checked_in"
                  | "in_progress"
                  | "completed"
                  | "cancelled",
              )}
            </p>
            <p>Provider timezone: {data.upcomingAppointment.provider?.timezone ?? "UTC"}</p>
            <p>
              Room:{" "}
              <Link
                href={`/org/${slug}/appointments/${data.upcomingAppointment.id}/room`}
                className="font-semibold underline"
              >
                Open appointment room
              </Link>
            </p>
          </CardContent>
        ) : null}
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-rose-50 to-white">
          <CardHeader>
            <CardDescription>Allergies</CardDescription>
            <CardTitle className="text-3xl">{data.chartSummary.allergies}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader>
            <CardDescription>Medications</CardDescription>
            <CardTitle className="text-3xl">{data.chartSummary.medications}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <CardDescription>Clinical notes</CardDescription>
            <CardTitle className="text-3xl">{data.chartSummary.notes}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
