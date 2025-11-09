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

    // Users can only access their own preferences
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user preferences
    const preferences = await db.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Return default preferences if none exist (no locale/timezone in app storage)
      const defaultPreferences = {
        currency: "USD",
        publicProfile: false,
      };

      return NextResponse.json({
        success: true,
        data: defaultPreferences,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        currency: preferences.currency,
        publicProfile: preferences.publicProfile,
      },
    });
  } catch (error) {
    console.error("Get user preferences error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    // Users can only update their own preferences
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Extract the fields that were provided (no locale/timezone)
    const updateData: {
      currency?: string;
      publicProfile?: boolean;
    } = {};

    if ("currency" in body) updateData.currency = body.currency;
    if ("publicProfile" in body) {
      if (typeof body.publicProfile !== "boolean") {
        return NextResponse.json(
          { error: "publicProfile must be a boolean" },
          { status: 400 }
        );
      }
      updateData.publicProfile = body.publicProfile;
    }

    // Update or create preferences
    const preferences = await db.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        currency: updateData.currency || "USD",
        publicProfile: updateData.publicProfile ?? false,
      },
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        currency: preferences.currency,
        publicProfile: preferences.publicProfile,
      },
    });
  } catch (error) {
    console.error("Update user preferences error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
