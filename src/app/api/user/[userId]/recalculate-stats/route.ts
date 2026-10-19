import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Preserve the old endpoint for clients without allowing a request to trigger
// an expensive global refresh. PostgreSQL schedules the derived summaries.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  const { userId } = await params;
  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    message:
      "Stats refresh automatically every 15 minutes. Uploads are already saved.",
  });
}
