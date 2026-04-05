import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  console.log(`[request] ${request.method} ${request.nextUrl.pathname} — IP: ${ip}`);

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
