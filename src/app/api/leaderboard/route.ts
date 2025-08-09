import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Applications, type ApplicationType } from "@/types";
import { unsupportedMethod } from "@/lib/routeUtils";
import { Prisma } from "@prisma/client";
import { n } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20"),
      500
    ); // Max 500

    const applicationParam = searchParams.get("applications") || "all";
    const applications =
      applicationParam === "all"
        ? Applications
        : (applicationParam.split(",") as ApplicationType[]);
    
    const usernameFilter = searchParams.get("username") || "";

    // Validate parameters
    if (page < 1) {
      return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 });
    }

    if (pageSize < 1 || pageSize > 500) {
      return NextResponse.json(
        { error: "Page size must be between 1 and 500" },
        { status: 400 }
      );
    }

    if (applications.length === 0) {
      return NextResponse.json(
        { error: "At least one application must be selected" },
        { status: 400 }
      );
    }

    // Build WHERE clause for username filter and public profile
    const whereConditions = [Prisma.sql`user_preferences."publicProfile" = TRUE`];
    
    if (usernameFilter) {
      const searchPattern = `%${usernameFilter}%`;
      whereConditions.push(
        Prisma.sql`(LOWER(users."username") LIKE LOWER(${searchPattern}) OR LOWER(users."displayName") LIKE LOWER(${searchPattern}))`
      );
    }
    
    const whereClause = Prisma.sql`${Prisma.join(whereConditions, ' AND ')}`;
    
    // Build application filter for LEFT JOIN
    const applicationFilter = applicationParam !== "all"
      ? Prisma.sql`AND message_stats."application" = ANY(${applications})`
      : Prisma.sql``;

    // Query aggregated stats directly from message_stats table
    const rawResults = await db.$queryRaw<
      Array<{
        userId: string;
        githubId: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        email: string | null;
        createdAt: Date;
        cost: number;
        tokens: Prisma.Decimal;
        linesAdded: Prisma.Decimal;
        linesDeleted: Prisma.Decimal;
        linesEdited: Prisma.Decimal;
        codeLines: Prisma.Decimal;
        docsLines: Prisma.Decimal;
        dataLines: Prisma.Decimal;
        todosCompleted: Prisma.Decimal;
        rank: bigint;
      }>
    >`
      WITH ranked_users AS (
        SELECT
          users.id as "userId",
          users."githubId",
          users."username",
          users."displayName",
          users."avatarUrl",
          users."email",
          users."createdAt",
          COALESCE(SUM(message_stats."cost"), 0) as cost,
          COALESCE(SUM(message_stats."cachedTokens" + message_stats."inputTokens" + message_stats."outputTokens"), 0) as tokens,
          COALESCE(SUM(message_stats."linesAdded"), 0) as "linesAdded",
          COALESCE(SUM(message_stats."linesDeleted"), 0) as "linesDeleted",
          COALESCE(SUM(message_stats."linesEdited"), 0) as "linesEdited",
          COALESCE(SUM(message_stats."codeLines"), 0) as "codeLines",
          COALESCE(SUM(message_stats."docsLines"), 0) as "docsLines",
          COALESCE(SUM(message_stats."dataLines"), 0) as "dataLines",
          COALESCE(SUM(message_stats."todosCompleted"), 0) as "todosCompleted",
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(message_stats."cost"), 0) DESC) as rank
        FROM users
        INNER JOIN user_preferences ON users.id = user_preferences."userId"
        LEFT JOIN message_stats ON users.id = message_stats."userId" ${applicationFilter}
        WHERE ${whereClause}
        GROUP BY users.id, users."githubId", users."username", users."displayName", users."avatarUrl", users."email", users."createdAt"
      )
      SELECT * FROM ranked_users
      ORDER BY rank
      LIMIT ${pageSize}
      OFFSET ${(page - 1) * pageSize}
    `;

    // Convert BigInt values to the expected format
    const usersWithMetrics = rawResults.map((row) => ({
      // User fields
      id: row.userId,
      githubId: row.githubId,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      email: row.email,
      createdAt: row.createdAt,
      rank: n(row.rank),

      // Stats fields - BigInt values need special handling
      cost: row.cost,
      tokens: n(row.tokens),
      linesAdded: n(row.linesAdded),
      linesDeleted: n(row.linesDeleted),
      linesEdited: n(row.linesEdited),
      codeLines: n(row.codeLines),
      docsLines: n(row.docsLines),
      dataLines: n(row.dataLines),
      todosCompleted: n(row.todosCompleted),
    }));

    // Get total count
    const totalCountResult = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT users.id)::bigint as count
      FROM users
      INNER JOIN user_preferences ON users.id = user_preferences."userId"
      WHERE ${whereClause}
    `;

    const total = Number(totalCountResult[0].count);

    const leaderboardData = {
      users: usersWithMetrics,
      total,
      currentPage: page,
      pageSize,
      application: applicationParam,
    };

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

export const POST = unsupportedMethod;
export const PUT = unsupportedMethod;
export const DELETE = unsupportedMethod;
