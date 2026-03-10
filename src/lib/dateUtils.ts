import { TZDate } from "@date-fns/tz";
import { PeriodType } from "@/types";

// ---------------------------------------------------------------------------
// Legacy local-time helpers
// ---------------------------------------------------------------------------
// These use the server's local timezone and are still used by some UI/chart
// code. Backend aggregation code should prefer the `...InTimezone()` wrappers
// further down, which avoid depending on the server timezone.

export function getHourStart(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    0,
    0,
    0
  );
}

export function getDayStart(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function getHourEnd(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    59,
    59,
    999
  );
}

export function getDayEnd(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  return new Date(
    weekStart.getTime() +
      6 * 24 * 60 * 60 * 1000 +
      23 * 60 * 60 * 1000 +
      59 * 60 * 1000 +
      59 * 1000 +
      999
  );
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getYearEnd(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export const getPeriodStart = (period: PeriodType): Date => {
  return {
    hourly: getHourStart(new Date()),
    daily: getDayStart(new Date()),
    weekly: getWeekStart(new Date()),
    monthly: getMonthStart(new Date()),
    yearly: getYearStart(new Date()),
  }[period];
};

export const getPeriodEnd = (period: PeriodType): Date => {
  return {
    hourly: getHourEnd(new Date()),
    daily: getDayEnd(new Date()),
    weekly: getWeekEnd(new Date()),
    monthly: getMonthEnd(new Date()),
    yearly: getYearEnd(new Date()),
  }[period];
};

/**
 * Get the start of a period for a specific date
 * Use this when calculating period boundaries for historical data
 */
export const getPeriodStartForDate = (period: PeriodType, date: Date): Date => {
  return {
    hourly: getHourStart(date),
    daily: getDayStart(date),
    weekly: getWeekStart(date),
    monthly: getMonthStart(date),
    yearly: getYearStart(date),
  }[period];
};

/**
 * Get the end of a period for a specific date
 * Use this when calculating period boundaries for historical data
 */
export const getPeriodEndForDate = (period: PeriodType, date: Date): Date => {
  return {
    hourly: getHourEnd(date),
    daily: getDayEnd(date),
    weekly: getWeekEnd(date),
    monthly: getMonthEnd(date),
    yearly: getYearEnd(date),
  }[period];
};

/**
 * Extract calendar parts for a date rendered in a target timezone.
 */
function getTimezoneDateParts(
  date: Date,
  timezone: string
): { year: number; monthIndex: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: "year" | "month" | "day") => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) {
      throw new Error(`Missing ${type} part for timezone ${timezone}`);
    }
    return parseInt(value, 10);
  };

  return {
    year: getPart("year"),
    monthIndex: getPart("month") - 1,
    day: getPart("day"),
  };
}

// ---------------------------------------------------------------------------
// UTC helpers for backend aggregation
// ---------------------------------------------------------------------------

function getUtcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function getUtcHourStart(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours()
    )
  );
}

function getUtcNextDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
  );
}

function getUtcWeekStart(date: Date): Date {
  const weekStart = getUtcDayStart(date);
  const day = weekStart.getUTCDay();
  const diff = weekStart.getUTCDate() - day + (day === 0 ? -6 : 1);
  weekStart.setUTCDate(diff);
  return weekStart;
}

function getUtcMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getUtcYearStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function getUtcPeriodStart(period: PeriodType, date: Date): Date {
  return {
    hourly: getUtcHourStart(date),
    daily: getUtcDayStart(date),
    weekly: getUtcWeekStart(date),
    monthly: getUtcMonthStart(date),
    yearly: getUtcYearStart(date),
  }[period];
}

function getUtcExclusivePeriodEnd(period: PeriodType, date: Date): Date {
  const periodStart = getUtcPeriodStart(period, date);

  switch (period) {
    case "hourly":
      return new Date(periodStart.getTime() + 60 * 60 * 1000);
    case "daily":
      return getUtcNextDayStart(periodStart);
    case "weekly":
      return new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "monthly":
      return new Date(
        Date.UTC(
          periodStart.getUTCFullYear(),
          periodStart.getUTCMonth() + 1,
          1
        )
      );
    case "yearly":
      return new Date(Date.UTC(periodStart.getUTCFullYear() + 1, 0, 1));
  }
}

function toInclusiveEnd(exclusiveEnd: Date): Date {
  return new Date(exclusiveEnd.getTime() - 1);
}

function getUtcInclusivePeriodEnd(period: PeriodType, date: Date): Date {
  return toInclusiveEnd(getUtcExclusivePeriodEnd(period, date));
}

// ---------------------------------------------------------------------------
// Timezone-aware daily helpers
// ---------------------------------------------------------------------------

function getDayStartFromTimezoneParts(
  year: number,
  monthIndex: number,
  day: number,
  timezone: string
): Date {
  return new Date(new TZDate(year, monthIndex, day, timezone).getTime());
}

/**
 * Get the start of day for a date in a specific timezone.
 * Falls back to UTC if timezone is invalid.
 */
export function getDayStartInTimezone(date: Date, timezone: string): Date {
  try {
    const { year, monthIndex, day } = getTimezoneDateParts(date, timezone);
    return getDayStartFromTimezoneParts(year, monthIndex, day, timezone);
  } catch {
    // Fallback to UTC
    return getUtcDayStart(date);
  }
}

/**
 * Get the start of the next local day for a date in a specific timezone.
 * Falls back to the next UTC day if timezone is invalid.
 */
export function getNextDayStartInTimezone(date: Date, timezone: string): Date {
  try {
    const { year, monthIndex, day } = getTimezoneDateParts(date, timezone);
    return getDayStartFromTimezoneParts(year, monthIndex, day + 1, timezone);
  } catch {
    return getUtcNextDayStart(date);
  }
}

/**
 * Get the end of day for a date in a specific timezone.
 * Falls back to UTC if timezone is invalid.
 */
export function getDayEndInTimezone(date: Date, timezone: string): Date {
  return new Date(getNextDayStartInTimezone(date, timezone).getTime() - 1);
}

/**
 * Get period start for a date in a specific timezone.
 */
export function getPeriodStartForDateInTimezone(
  period: PeriodType,
  date: Date,
  timezone: string | null
): Date {
  if (timezone && period === "daily") {
    return getDayStartInTimezone(date, timezone);
  }

  // Aggregation buckets are UTC for non-daily periods and when the user has no
  // timezone preference, so they don't depend on the server's local timezone.
  return getUtcPeriodStart(period, date);
}

/**
 * Get the inclusive stored period end for a date in a specific timezone.
 */
export function getPeriodEndForDateInTimezone(
  period: PeriodType,
  date: Date,
  timezone: string | null
): Date {
  if (timezone && period === "daily") {
    return getDayEndInTimezone(date, timezone);
  }

  return getUtcInclusivePeriodEnd(period, date);
}

/**
 * Get the exclusive query boundary for a period in a specific timezone.
 * This is the instant immediately after the period ends, so it is safe to use
 * with `<` comparisons in database queries.
 */
export function getPeriodQueryEndForDateInTimezone(
  period: PeriodType,
  date: Date,
  timezone: string | null
): Date {
  if (timezone && period === "daily") {
    return getNextDayStartInTimezone(date, timezone);
  }

  return getUtcExclusivePeriodEnd(period, date);
}
