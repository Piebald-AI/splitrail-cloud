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

    // Users can only access their own preferences
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user preferences
    const preferences = await db.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Return default preferences if none exist
      const defaultPreferences = {
        displayNamePreference: "displayName",
        locale: "en",
        timezone: "UTC",
        currency: "USD",
        optOutPublic: false,
      };

      return NextResponse.json({
        success: true,
        data: defaultPreferences,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        displayNamePreference: preferences.displayNamePreference,
        locale: preferences.locale,
        timezone: preferences.timezone,
        currency: preferences.currency,
        optOutPublic: preferences.optOutPublic,
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
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Users can only update their own preferences
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const { displayNamePreference, locale, timezone, currency, optOutPublic } =
      body;

    if (
      !displayNamePreference ||
      !locale ||
      !timezone ||
      !currency ||
      typeof optOutPublic !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    // Validate enum values
    if (!["displayName", "username"].includes(displayNamePreference)) {
      return NextResponse.json(
        { error: "Invalid displayNamePreference value" },
        { status: 400 }
      );
    }

    // Update or create preferences
    const preferences = await db.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        displayNamePreference,
        locale,
        timezone,
        currency,
        optOutPublic,
      },
      update: {
        displayNamePreference,
        locale,
        timezone,
        currency,
        optOutPublic,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        displayNamePreference: preferences.displayNamePreference,
        locale: preferences.locale,
        timezone: preferences.timezone,
        currency: preferences.currency,
        optOutPublic: preferences.optOutPublic,
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
