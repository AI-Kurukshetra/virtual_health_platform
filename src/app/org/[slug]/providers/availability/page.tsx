import Link from "next/link";

import { deleteAvailabilityAction } from "@/app/org/[slug]/actions";
import { AvailabilityForm } from "@/components/forms/availability-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTenantContext } from "@/lib/auth/guards";
import { listProviderAppointmentWindows } from "@/lib/data/appointments";
import { buildBookableSlots } from "@/lib/data/slots";
import {
  getProviderAvailability,
  getProviderByProfile,
  listProviderRoster,
} from "@/lib/data/providers";
import { formatDateRangeInTimeZone } from "@/lib/timezone";

const dayLabel: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export default async function ProviderAvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ provider?: string }>;
}) {
  const { slug } = await params;
  const { provider: selectedProviderProfileId } = await searchParams;
  const context = await requireTenantContext(slug);

  if (context.role !== "org_admin" && context.role !== "provider") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability unavailable</CardTitle>
          <CardDescription>This section is only for providers and org admins.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ownProvider = await getProviderByProfile(context.organizationId, context.profileId);
  const roster =
    context.role === "org_admin" ? await listProviderRoster(context.organizationId) : [];
  const fallbackProfileId = context.role === "org_admin" ? roster[0]?.profileId ?? null : context.profileId;
  const requestedProfileId =
    context.role === "org_admin"
      ? (selectedProviderProfileId && selectedProviderProfileId.length > 0
          ? selectedProviderProfileId
          : fallbackProfileId)
      : context.profileId;
  const selectedProviderEntry =
    context.role === "org_admin"
      ? roster.find((entry) => entry.profileId === requestedProfileId) ?? null
      : null;
  const targetProfileId =
    context.role === "org_admin"
      ? selectedProviderEntry?.profileId ?? fallbackProfileId
      : context.profileId;
  const resolvedProviderEntry =
    context.role === "org_admin"
      ? roster.find((entry) => entry.profileId === targetProfileId) ?? null
      : null;
  const targetProvider = context.role === "org_admin" ? resolvedProviderEntry?.provider ?? null : ownProvider;
  const targetName = resolvedProviderEntry?.fullName ?? context.profileName;

  if (context.role === "org_admin" && !targetProfileId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No provider memberships found</CardTitle>
          <CardDescription>Add a provider membership before configuring availability.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!targetProvider) {
    return (
      <section className="space-y-4">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Weekly availability</h2>
          <p className="text-sm text-slate-600">
            Convert recurring provider windows into bookable appointment slots.
          </p>
        </header>
        {context.role === "org_admin" && roster.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Select provider</CardTitle>
              <CardDescription>Switch between provider memberships in this organization.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {roster.map((entry) => (
                <Link
                  key={entry.profileId}
                  href={`/org/${slug}/providers/availability?provider=${entry.profileId}`}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    entry.profileId === targetProfileId
                      ? "border-sky-300 bg-sky-50 text-sky-950"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {entry.fullName}
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>No provider profile found</CardTitle>
            <CardDescription>Create a provider profile first, then define availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/org/${slug}/providers/profile${targetProfileId ? `?provider=${targetProfileId}` : ""}`}
              className="text-sm font-semibold text-sky-900 underline"
            >
              Open provider profile
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  const [availability, appointmentWindows] = await Promise.all([
    getProviderAvailability(context.organizationId, targetProvider.id),
    listProviderAppointmentWindows(context.organizationId, targetProvider.id),
  ]);

  const slots = buildBookableSlots({
    availability: availability.map((item) => ({
      ...item,
      timezone: targetProvider.timezone,
    })),
    existingAppointments: appointmentWindows,
    days: 7,
  }).slice(0, 16);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Weekly availability</h2>
        <p className="text-sm text-slate-600">
          Convert recurring provider windows into bookable appointment slots.
        </p>
      </header>
      {context.role === "org_admin" && roster.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Select provider</CardTitle>
            <CardDescription>Manage availability for each provider membership.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {roster.map((entry) => (
              <Link
                key={entry.profileId}
                href={`/org/${slug}/providers/availability?provider=${entry.profileId}`}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  entry.profileId === targetProfileId
                    ? "border-sky-300 bg-sky-50 text-sky-950"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {entry.fullName}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{targetName}</CardTitle>
          <CardDescription>Provider timezone: {targetProvider.timezone}</CardDescription>
        </CardHeader>
      </Card>
      <AvailabilityForm
        organizationSlug={context.organizationSlug}
        providerId={targetProvider.id}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Availability rules</CardTitle>
            <CardDescription>Weekly windows used for booking.</CardDescription>
          </CardHeader>
          <CardContent>
            {availability.length ? (
              <ul className="space-y-2 text-sm">
                {availability.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <p>
                      {dayLabel[item.day_of_week]} · {item.start_time.slice(0, 5)}-{item.end_time.slice(0, 5)} · {item.slot_minutes}m
                    </p>
                    <form action={deleteAvailabilityAction}>
                      <input type="hidden" name="organizationSlug" value={context.organizationSlug} />
                      <input type="hidden" name="availabilityId" value={item.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-rose-600 underline"
                      >
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No availability windows yet.</EmptyState>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generated slots (next 7 days)</CardTitle>
            <CardDescription>Preview of slots available for booking.</CardDescription>
          </CardHeader>
          <CardContent>
            {slots.length ? (
              <ul className="space-y-2 text-sm">
                {slots.map((slot) => (
                  <li key={`${slot.providerId}-${slot.startsAt.toISOString()}`} className="rounded-md border border-slate-200 px-3 py-2">
                    {formatDateRangeInTimeZone(slot.startsAt, slot.endsAt, slot.providerTimeZone)}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No bookable slots generated for the next 7 days.</EmptyState>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
