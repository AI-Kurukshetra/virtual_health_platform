type LocalDate = {
  year: number;
  month: number;
  day: number;
};

type ZonedDateTimeParts = LocalDate & {
  hour: number;
  minute: number;
  second: number;
};

const zonedDateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function normalizeDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function getZonedDateTimeFormatter(timeZone: string) {
  const existing = zonedDateTimeFormatters.get(timeZone);

  if (existing) {
    return existing;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  zonedDateTimeFormatters.set(timeZone, formatter);

  return formatter;
}

export function getTimeZoneDateTimeParts(value: Date | string, timeZone: string): ZonedDateTimeParts {
  const date = normalizeDate(value);
  const parts = getZonedDateTimeFormatter(timeZone).formatToParts(date);

  const lookup = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.get("year") ?? 0),
    month: Number(lookup.get("month") ?? 0),
    day: Number(lookup.get("day") ?? 0),
    hour: Number(lookup.get("hour") ?? 0),
    minute: Number(lookup.get("minute") ?? 0),
    second: Number(lookup.get("second") ?? 0),
  };
}

export function getTimeZoneLocalDate(value: Date | string, timeZone: string): LocalDate {
  const { year, month, day } = getTimeZoneDateTimeParts(value, timeZone);

  return { year, month, day };
}

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const parts = getTimeZoneDateTimeParts(date, timeZone);
  const zonedUtcMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return zonedUtcMillis - date.getTime();
}

export function addLocalDays(localDate: LocalDate, days: number): LocalDate {
  const value = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day));
  value.setUTCDate(value.getUTCDate() + days);

  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
}

export function compareLocalDates(left: LocalDate, right: LocalDate) {
  return (
    Date.UTC(left.year, left.month - 1, left.day) -
    Date.UTC(right.year, right.month - 1, right.day)
  );
}

export function getWeekdayForLocalDate(localDate: LocalDate) {
  return new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay();
}

export function zonedTimeToUtc({
  localDate,
  timeValue,
  timeZone,
}: {
  localDate: LocalDate;
  timeValue: string;
  timeZone: string;
}) {
  const [hoursText, minutesText] = timeValue.split(":");
  const hours = Number(hoursText ?? 0);
  const minutes = Number(minutesText ?? 0);

  const utcGuess = Date.UTC(localDate.year, localDate.month - 1, localDate.day, hours, minutes, 0, 0);
  let date = new Date(utcGuess - getTimeZoneOffsetMilliseconds(new Date(utcGuess), timeZone));

  // Recompute once so DST boundary conversions settle on the correct offset.
  date = new Date(utcGuess - getTimeZoneOffsetMilliseconds(date, timeZone));

  return date;
}

export function getDayRangeInTimeZone(referenceDate: Date, timeZone: string) {
  const localDate = getTimeZoneLocalDate(referenceDate, timeZone);
  const nextLocalDate = addLocalDays(localDate, 1);

  return {
    start: zonedTimeToUtc({ localDate, timeValue: "00:00", timeZone }),
    endExclusive: zonedTimeToUtc({ localDate: nextLocalDate, timeValue: "00:00", timeZone }),
  };
}

export function formatDateTimeInTimeZone(
  value: Date | string,
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions,
) {
  const date = normalizeDate(value);

  return new Intl.DateTimeFormat("en-US", {
    ...(timeZone ? { timeZone } : {}),
    ...options,
  }).format(date);
}

export function formatDateRangeInTimeZone(
  start: Date | string,
  end: Date | string,
  timeZone?: string,
) {
  const startLabel = formatDateTimeInTimeZone(start, timeZone, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const endLabel = formatDateTimeInTimeZone(end, timeZone, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${startLabel} - ${endLabel}`;
}
