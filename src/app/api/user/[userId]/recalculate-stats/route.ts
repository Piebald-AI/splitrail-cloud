import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rebuildAllUserStats } from "@/lib/stats-recalculation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's timezone
    const userPrefs = await db.userPreferences.findUnique({
      where: { userId },
    });
    const timezone = userPrefs?.timezone || null;

    const messageSummary = await db.messageStats.aggregate({
      where: { userId },
      _count: { _all: true },
    });

    if (messageSummary._count._all === 0) {
      await db.userStats.deleteMany({
        where: { userId },
      });

      return NextResponse.json({
        success: true,
        message: "No messages to recalculate",
      });
    }

    await db.$transaction(
      async (tx) => {
        await tx.userStats.deleteMany({
          where: { userId },
        });

        await rebuildAllUserStats(userId, tx, timezone);
      },
      { timeout: 120_000 }
    );

    return NextResponse.json({
      success: true,
      message: `Recalculated stats from ${messageSummary._count._all} messages`,
    });
  } catch (error) {
    console.error("Recalculate stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
