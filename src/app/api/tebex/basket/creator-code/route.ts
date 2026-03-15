import { NextRequest, NextResponse } from "next/server";

import {
  applyCreatorCode,
  removeCreatorCode,
  TebexRequestError,
} from "@/lib/tebex-server";

function toUserMessage(error: TebexRequestError) {
  const body = error.responseBody || "";
  const lowered = body.toLowerCase();
  if (error.status === 404) return "The creator code doesn't exist.";
  if (lowered.includes("creator")) return "The creator code is invalid.";
  if (lowered.includes("invalid")) return "The creator code is invalid.";
  return "Could not apply creator code.";
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
    const data = await applyCreatorCode(body.basketIdent, body.code);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      return NextResponse.json({ error: toUserMessage(error) }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not apply creator code." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as { basketIdent?: string };

  if (!body.basketIdent) {
    return NextResponse.json({ error: "basketIdent is required" }, { status: 400 });
  }

  try {
    const data = await removeCreatorCode(body.basketIdent);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TebexRequestError) {
      return NextResponse.json(
        { error: "Could not remove creator code." },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not remove creator code." }, { status: 500 });
  }
}
