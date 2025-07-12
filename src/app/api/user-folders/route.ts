import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    // Get unique folders from user's daily stats
    const dailyStats = await db.dailyStats.findMany({
      where: {
        userId: user.id,
        folder: { not: null },
      },
      select: {
        folder: true,
        date: true,
      },
      orderBy: { date: "desc" },
    });

    // Group by folder and get latest date for each
    const foldersMap = new Map<string, { folder: string; latestDate: Date }>();

    dailyStats.forEach((stat) => {
      if (stat.folder) {
        const existing = foldersMap.get(stat.folder);
        if (!existing || stat.date > existing.latestDate) {
          foldersMap.set(stat.folder, {
            folder: stat.folder,
            latestDate: stat.date,
          });
        }
      }
    });

    const folders = Array.from(foldersMap.values()).sort(
      (a, b) => b.latestDate.getTime() - a.latestDate.getTime()
    );

    return NextResponse.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error("Get user folders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
