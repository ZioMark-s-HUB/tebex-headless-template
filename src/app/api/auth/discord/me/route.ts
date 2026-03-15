import { NextResponse } from "next/server";

// Discord user data is now stored in client-side sessionStorage (ephemeral per tab).
// This endpoint exists for backwards compatibility but always returns null.
export async function GET() {
  return NextResponse.json({ user: null });
}
