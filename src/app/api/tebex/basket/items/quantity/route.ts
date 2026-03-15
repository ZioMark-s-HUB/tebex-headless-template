import { NextRequest, NextResponse } from "next/server";

import { TebexRequestError, updateBasketPackageQuantity } from "@/lib/tebex-server";

function normalizeQuantityError(error: TebexRequestError) {
  const body = error.responseBody || "";
  const lowered = body.toLowerCase();
  if (lowered.includes("You cannot have more than 1 of this package in your basket".toLowerCase())) {
    return {
      status: 400,
      payload: {
        error: "This package allows only 1 quantity in the basket.",
        code: "quantity_locked",
      },
    };
  }

  return {
    status: error.status,
    payload: { error: "Could not update quantity." },
  };
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as {
    basketIdent?: string;
    packageId?: number | string;
    quantity?: number | string;
  };

  const basketIdent = String(body.basketIdent ?? "").trim();
  const packageId = Number(body.packageId);
  const quantity = Math.max(1, Number(body.quantity ?? 1));

  if (!basketIdent || !Number.isFinite(packageId) || packageId <= 0) {
    return NextResponse.json(
      { error: "basketIdent and packageId are required" },
      { status: 400 },
    );
  }

  try {
    const data = await updateBasketPackageQuantity(basketIdent, packageId, quantity);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      const normalized = normalizeQuantityError(error);
      return NextResponse.json(normalized.payload, { status: normalized.status });
    }
    return NextResponse.json(
      { error: "Could not update quantity." },
      { status: 500 },
    );
  }
}
