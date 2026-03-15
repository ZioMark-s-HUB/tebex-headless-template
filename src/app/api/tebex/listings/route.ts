import { NextResponse } from "next/server";

import { getListings } from "@/lib/tebex-server";

export async function GET() {
  try {
    const data = await getListings();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
