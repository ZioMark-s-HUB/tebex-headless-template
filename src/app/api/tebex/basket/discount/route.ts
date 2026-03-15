import { NextRequest, NextResponse } from "next/server";

import {
  applyDiscountCode,
  removeDiscountCode,
  TebexRequestError,
} from "@/lib/tebex-server";

function toUserMessage(error: TebexRequestError) {
  const body = error.responseBody || "";
  const lowered = body.toLowerCase();
  if (error.status === 404) return "The coupon doesn't exist.";
  if (lowered.includes("coupon")) return "The coupon doesn't exist or is not valid for this basket.";
  if (lowered.includes("invalid")) return "The coupon is invalid.";
  return "Could not apply coupon code.";
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { basketIdent?: string; code?: string };

  if (!body.basketIdent || !body.code) {
    return NextResponse.json(
      { error: "basketIdent and code are required" },
      { status: 400 },
    );
  }

  try {
    const data = await applyDiscountCode(body.basketIdent, body.code);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      return NextResponse.json({ error: toUserMessage(error) }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Could not apply coupon code." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as { basketIdent?: string; code?: string };

  if (!body.basketIdent) {
    return NextResponse.json({ error: "basketIdent is required" }, { status: 400 });
  }

  try {
    const data = await removeDiscountCode(body.basketIdent, body.code);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      if (error.status === 422) {
        return NextResponse.json(
          { error: "Could not remove coupon code. Please refresh and try again." },
          { status: 422 },
        );
      }
      return NextResponse.json(
        { error: "Could not remove coupon code." },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not remove coupon code." }, { status: 500 });
  }
}
