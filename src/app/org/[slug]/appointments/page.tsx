import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableCell, TableContainer, TableHeadCell } from "@/components/ui/table";
import { requireTenantContext } from "@/lib/auth/guards";
import {
  formatAppointmentStatus,
  getAppointmentStatusBadgeVariant,
} from "@/lib/data/appointments-shared";
import { listAppointments } from "@/lib/data/appointments";
import { formatDateRangeInTimeZone } from "@/lib/timezone";

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);

  const appointments = await listAppointments({
    organizationId: context.organizationId,
    role: context.role,
    profileId: context.profileId,
  });

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-lg shadow-sky-100/70">
        <Badge variant="info">Scheduling Hub</Badge>
        <h2 className="mt-2 text-2xl font-semibold text-sky-950">Appointments</h2>
        <p className="text-sm text-sky-800/80">
          Tenant-scoped visit schedule, status transitions, and direct room access.
        </p>
      </header>

      {appointments.length ? (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <TableHeadCell>Start</TableHeadCell>
                <TableHeadCell>Patient</TableHeadCell>
                <TableHeadCell>Provider</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <TableCell>
                    {formatDateRangeInTimeZone(
                      appointment.scheduled_start,
                      appointment.scheduled_end,
                      appointment.provider_timezone,
                    )}
                  </TableCell>
                  <TableCell>{appointment.patient_name}</TableCell>
                  <TableCell>{appointment.provider_name}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/org/${slug}/appointments/${appointment.id}`}
                        className="text-xs font-semibold text-sky-900 underline"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/org/${slug}/appointments/${appointment.id}/room`}
                        className="text-xs font-semibold text-sky-900 underline"
                      >
                        Room
                      </Link>
                    </div>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState>No appointments found for your role in this organization.</EmptyState>
      )}
      {context.role === "patient" ? (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle>Need a new visit?</CardTitle>
            <CardDescription>Book directly from available provider slots.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/org/${slug}/appointments/book`}
              className="inline-flex h-10 items-center rounded-xl bg-sky-600 px-4 text-sm font-medium text-white"
            >
              Book appointment
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
