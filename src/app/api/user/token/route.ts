import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all API tokens for the user
    const tokens = await db.apiToken.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    console.error("Get API tokens error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Create new API token
    const tokenCount = await db.apiToken.count({
      where: { userId: session.user.id },
    });

    if (tokenCount >= 50) {
      throw new Error("Maximum number of tokens (50) reached");
    }

    const tokenString =
      "st_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const token = await db.apiToken.create({
      data: {
        userId: session.user.id,
        token: tokenString,
        name: name || `CLI Token ${tokenCount + 1}`,
      },
      select: {
        id: true,
        token: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error("Create API token error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Maximum number of tokens")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get("tokenId");

    if (!tokenId) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    // Delete specific API token
    await db.apiToken.delete({
      where: {
        id: tokenId,
        userId: session.user.id, // Ensure user owns the token
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Token deleted successfully" },
    });
  } catch (error) {
    console.error("Delete API token error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
