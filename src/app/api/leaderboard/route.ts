import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
import { type SortColumn, type SortOrder } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const sortBy = (searchParams.get("sortBy") || "cost") as SortColumn;
    const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "100"),
      500
    ); // Max 500

    // Validate sort parameters
    const validSortColumns: SortColumn[] = [
      "cost",
      "tokens",
      "linesAdded",
      "linesDeleted",
      "linesModified",
      "projects",
      "languages",
      "codeLines",
      "docsLines",
      "dataLines",
      "todosCompleted",
    ];

    if (!validSortColumns.includes(sortBy)) {
      return NextResponse.json(
        { error: "Invalid sortBy parameter" },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return NextResponse.json(
        { error: "Invalid sortOrder parameter" },
        { status: 400 }
      );
    }

    if (page < 1) {
      return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 });
    }

    if (pageSize < 1 || pageSize > 500) {
      return NextResponse.json(
        { error: "Page size must be between 1 and 500" },
        { status: 400 }
      );
    }

    // Get leaderboard data
    const leaderboardData = await DatabaseService.getLeaderboardData(
      sortBy,
      sortOrder,
      page,
      pageSize
    );

    return NextResponse.json({
      success: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
