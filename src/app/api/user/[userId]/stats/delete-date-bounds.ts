import { TZDate } from "@date-fns/tz";

function parseLocalDateParts(date: string): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return { year: NaN, monthIndex: NaN, day: NaN };
  }

  return {
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function localDateParamToUtc(date: string, timezone: string): Date {
  const { year, monthIndex, day } = parseLocalDateParts(date);
  return new Date(new TZDate(year, monthIndex, day, timezone).getTime());
}

export function getDeleteDateBounds(
  startDate: string,
  endDate: string,
  timezone: string | null
): { startDateTime: Date; endDateTime: Date } {
  if (timezone) {
    const startDateTime = localDateParamToUtc(startDate, timezone);
    const endParts = parseLocalDateParts(endDate);
    const endExclusiveDateTime = new Date(
      new TZDate(
        endParts.year,
        endParts.monthIndex,
        endParts.day + 1,
        timezone
      ).getTime()
    );

    return {
      startDateTime,
      endDateTime: new Date(endExclusiveDateTime.getTime() - 1),
    };
  }

  return {
    startDateTime: new Date(`${startDate}T00:00:00.000Z`),
    endDateTime: new Date(`${endDate}T23:59:59.999Z`),
  };
}
