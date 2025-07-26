import { NextResponse } from "next/server";

export const unsupportedMethod = () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
