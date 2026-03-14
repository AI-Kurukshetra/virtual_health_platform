import { addMinutes, isAfter, isBefore } from "date-fns";

import {
  addLocalDays,
  compareLocalDates,
  getTimeZoneDateTimeParts,
  getTimeZoneLocalDate,
  getWeekdayForLocalDate,
  zonedTimeToUtc,
} from "@/lib/timezone";

export type AvailabilitySlotConfig = {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  is_active: boolean;
  timezone?: string | null;
};

export type ExistingAppointmentWindow = {
  provider_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
};

export type BookableSlot = {
  providerId: string;
  providerTimeZone: string;
  startsAt: Date;
  endsAt: Date;
};

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return isBefore(startA, endB) && isBefore(startB, endA);
}

function parseTimeToMinutes(timeValue: string) {
  const [hoursText, minutesText] = timeValue.split(":");
  return Number(hoursText ?? 0) * 60 + Number(minutesText ?? 0);
}

export function slotMatchesAvailability({
  availability,
  providerId,
  scheduledStart,
  scheduledEnd,
}: {
  availability: AvailabilitySlotConfig[];
  providerId: string;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
}) {
  const slotStart = scheduledStart instanceof Date ? scheduledStart : new Date(scheduledStart);
  const slotEnd = scheduledEnd instanceof Date ? scheduledEnd : new Date(scheduledEnd);

  if (!isAfter(slotEnd, slotStart)) {
    return false;
  }

  return availability.some((rule) => {
    if (!rule.is_active || rule.provider_id !== providerId) {
      return false;
    }

    const timeZone = rule.timezone ?? "UTC";
    const startParts = getTimeZoneDateTimeParts(slotStart, timeZone);
    const endParts = getTimeZoneDateTimeParts(slotEnd, timeZone);

    if (
      startParts.year !== endParts.year ||
      startParts.month !== endParts.month ||
      startParts.day !== endParts.day
    ) {
      return false;
    }

    const slotStartMinutes = startParts.hour * 60 + startParts.minute;
    const slotEndMinutes = endParts.hour * 60 + endParts.minute;
    const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / 60000;
    const ruleStartMinutes = parseTimeToMinutes(rule.start_time);
    const ruleEndMinutes = parseTimeToMinutes(rule.end_time);
    const slotWeekday = getWeekdayForLocalDate({
      year: startParts.year,
      month: startParts.month,
      day: startParts.day,
    });

    if (slotWeekday !== rule.day_of_week) {
      return false;
    }

    if (slotDuration !== rule.slot_minutes) {
      return false;
    }

    if (slotStartMinutes < ruleStartMinutes || slotEndMinutes > ruleEndMinutes) {
      return false;
    }

    return (slotStartMinutes - ruleStartMinutes) % rule.slot_minutes === 0;
  });
}

export function buildBookableSlots({
  availability,
  existingAppointments,
  startDate,
  days,
}: {
  availability: AvailabilitySlotConfig[];
  existingAppointments: ExistingAppointmentWindow[];
  startDate?: Date;
  days?: number;
}) {
  const fromDate = startDate ?? new Date();
  const horizonDays = days ?? 14;
  const blockingAppointments = existingAppointments.filter((appointment) =>
    ["scheduled", "checked_in", "in_progress"].includes(appointment.status),
  );
  const slots: BookableSlot[] = [];
  const providerDateRanges = new Map<string, { start: ReturnType<typeof getTimeZoneLocalDate>; end: ReturnType<typeof getTimeZoneLocalDate> }>();

  for (const rule of availability) {
    const timeZone = rule.timezone ?? "UTC";

    if (!providerDateRanges.has(timeZone)) {
      providerDateRanges.set(timeZone, {
        start: getTimeZoneLocalDate(fromDate, timeZone),
        end: getTimeZoneLocalDate(addMinutes(fromDate, horizonDays * 24 * 60), timeZone),
      });
    }
  }

  for (const rule of availability) {
    if (!rule.is_active) {
      continue;
    }

    const timeZone = rule.timezone ?? "UTC";
    const localRange = providerDateRanges.get(timeZone);

    if (!localRange) {
      continue;
    }

    let localDay = localRange.start;

    while (compareLocalDates(localDay, localRange.end) <= 0) {
      if (getWeekdayForLocalDate(localDay) === rule.day_of_week) {
        let pointer = zonedTimeToUtc({
          localDate: localDay,
          timeValue: rule.start_time,
          timeZone,
        });
        const endBoundary = zonedTimeToUtc({
          localDate: localDay,
          timeValue: rule.end_time,
          timeZone,
        });

        while (isBefore(pointer, endBoundary)) {
          const slotEnd = addMinutes(pointer, rule.slot_minutes);

          if (!isAfter(slotEnd, endBoundary)) {
            const hasConflict = blockingAppointments.some((appointment) => {
              if (appointment.provider_id !== rule.provider_id) {
                return false;
              }

              return overlaps(
                pointer,
                slotEnd,
                new Date(appointment.scheduled_start),
                new Date(appointment.scheduled_end),
              );
            });

            if (!hasConflict && isAfter(pointer, new Date())) {
              slots.push({
                providerId: rule.provider_id,
                providerTimeZone: timeZone,
                startsAt: new Date(pointer),
                endsAt: new Date(slotEnd),
              });
            }
          }

          pointer = addMinutes(pointer, rule.slot_minutes);
        }
      }

      localDay = addLocalDays(localDay, 1);
    }
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
