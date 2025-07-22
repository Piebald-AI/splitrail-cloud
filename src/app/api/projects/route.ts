import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type CreateProjectRequest } from "@/types";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { name: "asc" },
      include: {
        folderProjects: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Validate token and get user
    const apiToken = await db.apiToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    // Update last used timestamp
    await db.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    // Parse request body
    const body: CreateProjectRequest = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create project
    const project = await db.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        openSource: body.openSource || false,
        githubLink: body.githubLink || null,
        websiteLink: body.websiteLink || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Project name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
