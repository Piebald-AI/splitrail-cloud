import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AFFECTED_CODEX_MODELS } from "@/lib/codex-pricing";

function formatDateKey(date: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fall back to UTC if a stored timezone is invalid.
  }

  return date.toISOString().slice(0, 10);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [preferences, affectedRows] = await Promise.all([
      db.userPreferences.findUnique({
        where: { userId },
        select: { timezone: true },
      }),
      db.userStats.findMany({
        where: {
          userId,
          application: "codex_cli",
          period: "daily",
          cost: 0,
          models: {
            hasSome: [...AFFECTED_CODEX_MODELS],
          },
        },
        select: { periodStart: true },
        orderBy: { periodStart: "asc" },
      }),
    ]);

    const timezone = preferences?.timezone || "UTC";
    const affectedDates = affectedRows.map(({ periodStart }) =>
      formatDateKey(periodStart, timezone)
    );

    return NextResponse.json({
      success: true,
      data: {
        hasAffectedData: affectedDates.length > 0,
        affectedDates,
        timezone,
      },
    });
  } catch (error) {
    console.error("Codex pricing check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
