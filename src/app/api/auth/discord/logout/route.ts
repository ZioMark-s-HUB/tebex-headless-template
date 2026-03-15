import { NextRequest, NextResponse } from "next/server";

import { tebexConfig } from "@/lib/env";

// Discord session data lives in client-side sessionStorage.
// The client clears it before redirecting here; this just handles the redirect.
export async function GET(request: NextRequest) {
  const returnTo =
    request.nextUrl.searchParams.get("returnTo") || `${tebexConfig.siteUrl}/`;
  return NextResponse.redirect(returnTo);
}
