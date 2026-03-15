import { NextRequest, NextResponse } from "next/server";

import { createBasket, getBasket, TebexRequestError } from "@/lib/tebex-server";

function parseTebexError(body?: string) {
  if (!body) return null;
  try {
    return JSON.parse(body) as { detail?: string; title?: string; message?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      username?: string;
    };
    const data = await createBasket(body.username);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      const parsed = parseTebexError(error.responseBody);
      console.error("[tebex:basket:create] upstream error", {
        status: error.status,
        detail: parsed?.detail,
        title: parsed?.title,
        message: parsed?.message,
        responseBody: error.responseBody,
      });
      return NextResponse.json(
        {
          error: parsed?.detail || parsed?.message || error.message,
          detail: parsed?.detail,
          title: parsed?.title,
        },
        { status: error.status },
      );
    }

    console.error("[tebex:basket:create] unexpected error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const basketIdent = request.nextUrl.searchParams.get("basketIdent");
  if (!basketIdent) {
    console.warn("[tebex:basket:get] missing basketIdent", {
      referer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      path: request.nextUrl.pathname,
      search: request.nextUrl.search,
    });
    return NextResponse.json({ error: "basketIdent is required" }, { status: 400 });
  }

  try {
    const data = await getBasket(basketIdent);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      const parsed = parseTebexError(error.responseBody);
      console.error("[tebex:basket:get] upstream error", {
        basketIdent,
        status: error.status,
        detail: parsed?.detail,
        title: parsed?.title,
        message: parsed?.message,
        responseBody: error.responseBody,
      });
      return NextResponse.json(
        {
          error: parsed?.detail || parsed?.message || error.message,
          detail: parsed?.detail,
          title: parsed?.title,
        },
        { status: error.status },
      );
    }

    console.error("[tebex:basket:get] unexpected error", { basketIdent, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
