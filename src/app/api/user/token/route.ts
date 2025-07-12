import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DatabaseService } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all API tokens for the user
    const tokens = await DatabaseService.getUserApiTokens(session.user.id);

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Create new API token
    const token = await DatabaseService.createApiToken(session.user.id, name);

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
    const session = await getServerSession(authOptions);

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
    await DatabaseService.deleteApiToken(session.user.id, tokenId);

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
