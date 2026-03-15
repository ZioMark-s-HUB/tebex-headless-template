import { NextRequest, NextResponse } from "next/server";

import { getBasket } from "@/lib/tebex-server";

function parseCheckoutIdent(checkoutUrl: string) {
  const parts = checkoutUrl.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export async function GET(request: NextRequest) {
  const basketIdent = request.nextUrl.searchParams.get("basketIdent");
  if (!basketIdent) {
    return NextResponse.json({ error: "basketIdent is required" }, { status: 400 });
  }

  try {
    const { data } = await getBasket(basketIdent);
    const url = data.links.checkout;
    const ident = parseCheckoutIdent(url);
    return NextResponse.json({ url, ident: ident || undefined });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
