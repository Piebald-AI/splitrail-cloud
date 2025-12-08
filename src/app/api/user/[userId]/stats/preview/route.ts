import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;
    const { searchParams } = new URL(request.url);

    // Authorization
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || startDate;
    const applicationsParam = searchParams.get("applications");

    if (!startDate || !applicationsParam) {
      return NextResponse.json(
        { error: "Missing required parameters: startDate, applications" },
        { status: 400 }
      );
    }

    const applications = applicationsParam.split(",");

    // Parse dates
    const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
    const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (endDateTime < startDateTime) {
      return NextResponse.json(
        { error: "End date must be >= start date" },
        { status: 400 }
      );
    }

    // Count messages that would be deleted
    const count = await db.messageStats.count({
      where: {
        userId,
        application: { in: applications },
        date: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
    });

    // Calculate affected days
    const affectedDays =
      Math.ceil(
        (endDateTime.getTime() - startDateTime.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    return NextResponse.json({
      success: true,
      data: {
        messageCount: count,
        affectedDays,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        applications,
      },
    });
  } catch (error) {
    console.error("Preview deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
