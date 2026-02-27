import { addDays, format, getISOWeek } from "date-fns";
import { TZDateMini } from "@date-fns/tz";
import { type AnalyticsPeriod } from "./types";

export const utc = (date: string) => new TZDateMini(date, "UTC");

export function formatDateForDisplay(date: string, period: AnalyticsPeriod) {
  const dateObj = utc(date);
  if (period === "weekly") {
    return `Week ${getISOWeek(dateObj)}`;
  }
  if (period === "monthly") {
    return format(dateObj, "MMM yyyy");
  }
  return format(dateObj, "MM/dd/yyyy");
}

export function getDateHoverText(date: string, period: AnalyticsPeriod) {
  const dateObj = utc(date);
  if (period === "weekly") {
    const weekStart = format(dateObj, "MM/dd/yyyy");
    const weekEnd = format(addDays(dateObj, 6), "MM/dd/yyyy");
    return `Week ${getISOWeek(dateObj)} (${weekStart} - ${weekEnd})`;
  }
  return format(dateObj, "MM/dd/yyyy");
}

export function getPeriodStart(date: Date, period: AnalyticsPeriod): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  if (period === "weekly") {
    const day = normalized.getUTCDay();
    const diff = normalized.getUTCDate() - day + (day === 0 ? -6 : 1);
    normalized.setUTCDate(diff);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }
  if (period === "monthly") {
    normalized.setUTCDate(1);
    return normalized;
  }
  return normalized;
}

export function addPeriod(date: Date, period: AnalyticsPeriod): Date {
  const next = new Date(date);
  if (period === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }
  if (period === "monthly") {
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    return next;
  }
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export function getPeriodCountLabel(count: number, period: AnalyticsPeriod): string {
  const unit = period === "daily" ? "day" : period === "weekly" ? "week" : "month";
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

export function getPeriodLabel(period: AnalyticsPeriod): string {
  if (period === "weekly") return "Weekly";
  if (period === "monthly") return "Monthly";
  return "Daily";
}
