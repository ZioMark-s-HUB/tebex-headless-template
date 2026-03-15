import { NextRequest, NextResponse } from "next/server";

import { removePackageFromBasket, TebexRequestError } from "@/lib/tebex-server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    basketIdent?: string;
    packageId?: number | string;
  };

  const basketIdent = String(body.basketIdent ?? "").trim();
  const packageId = Number(body.packageId);
  if (!basketIdent || !Number.isFinite(packageId) || packageId <= 0) {
    return NextResponse.json(
      { error: "basketIdent and packageId are required" },
      { status: 400 },
    );
  }

  try {
    const data = await removePackageFromBasket(basketIdent, packageId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
