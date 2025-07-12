import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
import { transformCliData } from "@/lib/utils";
import { type UploadStatsRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate token and get user
    const user = await DatabaseService.validateApiToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    // Parse request body
    const body: UploadStatsRequest = await request.json();

    // Validate required fields
    if (!body.date || !body.stats) {
      return NextResponse.json(
        { error: "Missing required fields: date, stats" },
        { status: 400 }
      );
    }

    // Parse and validate date
    const date = new Date(body.date);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Transform CLI data to database format
    const transformedStats = transformCliData(body.stats, body.folder);

    // Store or update daily stats
    const dailyStats = await DatabaseService.upsertDailyStats(
      user.id,
      date,
      transformedStats
    );

    return NextResponse.json({
      success: true,
      data: {
        id: dailyStats.id,
        date: dailyStats.date.toISOString(),
        updated: dailyStats.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Upload stats error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
