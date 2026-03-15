import { NextRequest, NextResponse } from "next/server";

import { tebexConfig } from "@/lib/env";
import { buildAuthUrl, getTebexAuthHeader } from "@/lib/tebex-server";

type AuthProvider = { name?: string; url?: string };

function extractAuthProviders(payload: unknown): AuthProvider[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => item as AuthProvider)
      .filter((item) => Boolean(item?.url));
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as {
    name?: string;
    url?: string;
    urls?: Array<{ name?: string; url?: string }>;
    data?: { name?: string; url?: string } | Array<{ name?: string; url?: string }>;
  };

  if (root.url) return [{ name: root.name, url: root.url }];
  if (Array.isArray(root.urls)) return root.urls.filter((item) => Boolean(item?.url));
  if (Array.isArray(root.data)) return root.data.filter((item) => Boolean(item?.url));
  if (!Array.isArray(root.data) && root.data?.url) return [root.data];
  return [];
}

function extractAuthUrl(payload: unknown) {
  if (Array.isArray(payload)) {
    const first = payload[0] as { url?: string } | undefined;
    return first?.url ?? "";
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }
  const root = payload as {
    url?: string;
    urls?: Array<{ url?: string }>;
    data?: { url?: string } | Array<{ url?: string }>;
  };

  if (root.url) return root.url;
  if (Array.isArray(root.urls) && root.urls[0]?.url) return root.urls[0].url;
  if (Array.isArray(root.data) && root.data[0]?.url) return root.data[0].url;
  if (!Array.isArray(root.data) && root.data?.url) return root.data.url;
  return "";
}

function pickProviderUrl(providers: AuthProvider[], provider: string) {
  const target = provider.toLowerCase();
  const match = providers.find((item) => {
    const name = (item.name || "").toLowerCase();
    const url = (item.url || "").toLowerCase();
    return name.includes(target) || url.includes(target);
  });
  return match?.url ?? "";
}

export async function GET(request: NextRequest) {
  const basketIdent = request.nextUrl.searchParams.get("basketIdent");
  const returnUrlParam = request.nextUrl.searchParams.get("returnUrl");
  const forcedProvider = request.nextUrl.searchParams.get("provider");
  if (!basketIdent) {
    return NextResponse.json({ error: "basketIdent is required" }, { status: 400 });
  }

  const returnUrl = returnUrlParam || `${tebexConfig.siteUrl}/cart`;
  const accountAuth = new URL(
    `https://headless.tebex.io/api/accounts/${tebexConfig.webstoreIdentifier}/auth`,
  );
  accountAuth.searchParams.set("returnUrl", returnUrl);
  accountAuth.searchParams.set("basketIdent", basketIdent);

  const candidateEndpoints = [buildAuthUrl(basketIdent, returnUrl), accountAuth.toString()];

  try {
    const attempts: string[] = [];
    for (const endpoint of candidateEndpoints) {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: getTebexAuthHeader(), Accept: "application/json" },
      });
      const raw = await res.text();
      let payload: unknown = null;
      if (raw) {
        try {
          payload = JSON.parse(raw) as unknown;
        } catch {
          payload = null;
        }
      }

      if (!res.ok) {
        attempts.push(`${endpoint} -> ${res.status}: ${raw}`);
        continue;
      }

      const locationHeader = res.headers.get("location") || "";
      const providers = extractAuthProviders(payload);
      const providerUrl = forcedProvider
        ? pickProviderUrl(providers, forcedProvider)
        : "";
      const url =
        providerUrl ||
        extractAuthUrl(payload) ||
        locationHeader ||
        (res.redirected ? res.url : "");
      if (url) {
        return NextResponse.json({ url, providers });
      }

      attempts.push(`${endpoint} -> 200 but no url. Payload: ${raw}`);
    }

    return NextResponse.json(
      { error: `No auth URL returned by Tebex. Attempts: ${attempts.join(" | ")}` },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
