import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db";
import { db } from "@/lib/db";
import { type AssociateFolderRequest } from "@/types";

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

    // Get user's folder-project associations
    const folderProjects = await db.folderProject.findMany({
      where: { userId: user.id },
      include: {
        project: true,
      },
      orderBy: { folder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: folderProjects,
    });
  } catch (error) {
    console.error("Get folder-projects error:", error);
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
    const user = await DatabaseService.validateApiToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    // Parse request body
    const body: AssociateFolderRequest = await request.json();

    // Validate required fields
    if (!body.folder || !body.projectId) {
      return NextResponse.json(
        { error: "Folder and project ID are required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: body.projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create or update folder-project association
    const folderProject = await db.folderProject.upsert({
      where: {
        userId_folder: {
          userId: user.id,
          folder: body.folder,
        },
      },
      update: {
        projectId: body.projectId,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        folder: body.folder,
        projectId: body.projectId,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: folderProject,
    });
  } catch (error) {
    console.error("Associate folder-project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get folder from query params
    const url = new URL(request.url);
    const folder = url.searchParams.get("folder");

    if (!folder) {
      return NextResponse.json(
        { error: "Folder parameter is required" },
        { status: 400 }
      );
    }

    // Delete folder-project association
    const deleted = await db.folderProject.delete({
      where: {
        userId_folder: {
          userId: user.id,
          folder,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    console.error("Delete folder-project error:", error);

    // Handle record not found
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json(
        { error: "Folder-project association not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
