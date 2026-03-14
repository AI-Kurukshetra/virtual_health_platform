import { AppointmentBookingForm } from "@/components/forms/appointment-booking-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole, requireTenantContext } from "@/lib/auth/guards";
import { listActiveAppointmentWindowsForOrg } from "@/lib/data/appointments";
import { getPatientByProfile } from "@/lib/data/patients";
import { getAssignedProviderIdsForPatient } from "@/lib/data/patient-invitations";
import { listAllAvailabilityForOrg, listProviders } from "@/lib/data/providers";
import { buildBookableSlots } from "@/lib/data/slots";
import { formatDateRangeInTimeZone } from "@/lib/timezone";

export default async function AppointmentBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireTenantContext(slug);
  requireRole(context, ["patient"]);

  const [providers, availability, existingAppointments, ownPatient] = await Promise.all([
    listProviders(context.organizationId),
    listAllAvailabilityForOrg(context.organizationId),
    listActiveAppointmentWindowsForOrg(context.organizationId),
    getPatientByProfile(context.organizationId, context.profileId),
  ]);

  const assignedProviderIds = ownPatient
    ? await getAssignedProviderIdsForPatient(context.organizationId, ownPatient.id)
    : [];
  const scopedProviderIds = new Set(assignedProviderIds);
  const shouldScopeToAssignedProviders = scopedProviderIds.size > 0;

  const filteredProviders = shouldScopeToAssignedProviders
    ? providers.filter((provider) => scopedProviderIds.has(provider.id))
    : providers;
  const filteredAvailability = shouldScopeToAssignedProviders
    ? availability.filter((item) => scopedProviderIds.has(item.provider_id))
    : availability;

  const providerMap = new Map(
    filteredProviders.map((provider) => {
      const profile = Array.isArray(provider.profile) ? provider.profile[0] : provider.profile;
      return [
        provider.id,
        {
          name: profile?.full_name ?? "Provider",
          timeZone: provider.timezone ?? "UTC",
        },
      ];
    }),
  );

  const slots = buildBookableSlots({
    availability: filteredAvailability.map((rule) => ({
      ...rule,
      timezone: providerMap.get(rule.provider_id)?.timeZone ?? "UTC",
    })),
    existingAppointments,
    days: 14,
  }).slice(0, 24);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Book an appointment</h2>
        <p className="text-sm text-slate-600">Choose an open slot from provider weekly availability.</p>
        {shouldScopeToAssignedProviders ? (
          <p className="text-xs text-slate-600">
            Showing providers already linked to your care team assignment.
          </p>
        ) : null}
      </header>
      {slots.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {slots.map((slot) => (
            <Card key={`${slot.providerId}-${slot.startsAt.toISOString()}`}>
              <CardHeader>
                <CardTitle>{providerMap.get(slot.providerId)?.name ?? "Provider"}</CardTitle>
                <CardDescription>
                  {formatDateRangeInTimeZone(slot.startsAt, slot.endsAt, slot.providerTimeZone)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-slate-600">Provider timezone: {slot.providerTimeZone}</p>
                <AppointmentBookingForm
                  organizationSlug={context.organizationSlug}
                  providerId={slot.providerId}
                  scheduledStart={slot.startsAt.toISOString()}
                  scheduledEnd={slot.endsAt.toISOString()}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState>
          No slots are currently available. Check back later or ask your provider to add availability.
        </EmptyState>
      )}
    </section>
  );
}
