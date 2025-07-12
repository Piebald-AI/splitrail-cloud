import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// class SentryExampleAPIError extends Error {
//   constructor(message: string | undefined) {
//     super(message);
//     this.name = "SentryExampleAPIError";
//   }
// }

// A faulty API route to test Sentry's error monitoring
export function GET() {
  // This will be automatically caught by Sentry's global error handling
  throw new Error(
    "Uncaught error that will be automatically captured by Sentry"
  );

  return NextResponse.json({ data: "Testing Sentry Error..." });
}
