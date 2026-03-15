import { NextRequest, NextResponse } from "next/server";

import { addPackageToBasket, TebexRequestError } from "@/lib/tebex-server";

function parseTebexError(body?: string) {
  if (!body) return null;
  try {
    return JSON.parse(body) as { detail?: string; title?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    basketIdent?: string;
    packageId?: number | string;
    quantity?: number | string;
    variableData?: Record<string, string>;
  };

  const basketIdent = String(body.basketIdent ?? "").trim();
  const packageId = Number(body.packageId);
  const quantity = Math.max(1, Number(body.quantity ?? 1));

  if (!basketIdent || !Number.isFinite(packageId) || packageId <= 0) {
    return NextResponse.json(
      {
        error: "basketIdent and packageId are required",
        received: { basketIdent: body.basketIdent, packageId: body.packageId },
      },
      { status: 400 },
    );
  }

  try {
    const data = await addPackageToBasket(
      basketIdent,
      packageId,
      quantity,
      body.variableData,
    );
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      const parsed = parseTebexError(error.responseBody);
      const detail = parsed?.detail || "";
      // Variable/login requirements are expected flow — don't log as errors
      const isExpected =
        (error.status === 400 && detail.toLowerCase().includes("please enter the")) ||
        (error.status === 422 && detail.toLowerCase().includes("must login"));
      if (!isExpected) {
        console.error("[tebex:basket:items:add] upstream error", {
          basketIdent,
          packageId,
          quantity,
          status: error.status,
          detail: parsed?.detail,
          title: parsed?.title,
          responseBody: error.responseBody,
        });
      }
      return NextResponse.json(
        {
          error: error.message,
          detail: parsed?.detail,
          title: parsed?.title,
        },
        { status: error.status },
      );
    }

    console.error("[tebex:basket:items:add] unexpected error", {
      basketIdent,
      packageId,
      quantity,
      error,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
