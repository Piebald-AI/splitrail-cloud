import { NextRequest, NextResponse } from "next/server";
import { DatabaseService, db } from "@/lib/db";
import { AIMessage, UserMessage, type UploadStatsRequest } from "@/types";

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

    // Validate token and get user.
    const user = await DatabaseService.validateApiToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    const body: UploadStatsRequest = await request.json();

    for (const chunk of body) {
      let message = chunk.message;
      if ("AI" in message && message.AI) {
        const { fileOperations, todoStats, ...aiMessage } =
          message.AI as AIMessage;
        await db.messageStats.create({
          data: {
            type: "AI",
            ...aiMessage,
            ...fileOperations,
            ...todoStats,
          },
        });
      } else if ("User" in message && message.User) {
        const { todoStats, ...userMessage } = message.User as UserMessage;
        await db.messageStats.create({
          data: {
            type: "User",
            ...userMessage,
            ...todoStats,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: "Invalid message format (expected 'AI' or 'User' root key)",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
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
