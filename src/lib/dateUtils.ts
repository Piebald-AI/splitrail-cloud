import { PeriodType } from "@/types";

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
export const getPeriodStartForDate = (
  period: PeriodType,
  date: Date
): Date => {
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
