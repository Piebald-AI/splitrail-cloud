import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DatabaseService, db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "all";

    // Users can only access their own profile data (for now)
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile data
    const profileData = await DatabaseService.getUserProfile(userId, timeRange);

    if (!profileData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const deleteType = searchParams.get("type") || "data";

    // Users can only delete their own data/account
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (deleteType === "data") {
      // Delete all user data (daily stats, API tokens, preferences) but keep account
      await db.dailyStats.deleteMany({
        where: { userId },
      });

      await db.apiToken.deleteMany({
        where: { userId },
      });

      await db.userPreferences.deleteMany({
        where: { userId },
      });

      return NextResponse.json({
        success: true,
        message: "All user data deleted successfully",
      });
    } else if (deleteType === "account") {
      // Delete entire account and all associated data
      await db.dailyStats.deleteMany({
        where: { userId },
      });

      await db.apiToken.deleteMany({
        where: { userId },
      });

      await db.userPreferences.deleteMany({
        where: { userId },
      });

      await db.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        success: true,
        message: "Account and all data deleted successfully",
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid delete type. Use "data" or "account"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Delete user data/account error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
