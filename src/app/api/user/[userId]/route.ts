import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Users can only access their own profile data (for now)
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile data
    const profileData = await db.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });
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
    if (deleteType !== "data" && deleteType !== "account") {
      return NextResponse.json(
        { error: "Invalid delete type" },
        { status: 400 }
      );
    }

    // Delete all data.
    await db.userStats.deleteMany({
      where: { userId },
    });

    await db.messageStats.deleteMany({
      where: { userId },
    });

    await db.apiToken.deleteMany({
      where: { userId },
    });

    await db.userPreferences.deleteMany({
      where: { userId },
    });

    if (deleteType === "account") {
      // Delete the account, since that's what they asked for.
      await db.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        success: true,
        message: "Account and all data deleted successfully",
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "All user data deleted successfully",
      });
    }
  } catch (error) {
    console.error("Delete user data/account error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
