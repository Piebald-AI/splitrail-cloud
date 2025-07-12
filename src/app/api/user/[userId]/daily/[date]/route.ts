import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; date: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId, date } = await params;

    // Users can only access their own daily stats
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Get daily stats for the specific date
    const dailyStats = await db.dailyStats.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });

    if (!dailyStats) {
      return NextResponse.json(
        { error: "No data found for this date" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dailyStats,
    });
  } catch (error) {
    console.error("Get daily stats error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; date: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId, date } = await params;

    // Users can only delete their own daily stats
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Delete daily stats for the specific date
    await db.dailyStats.delete({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data deleted successfully",
      deletedDate: date,
    });
  } catch (error) {
    console.error("Delete daily stats error:", error);

    // Handle case where record doesn't exist
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json(
        { error: "No data found for this date" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
