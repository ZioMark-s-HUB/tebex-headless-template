import { NextRequest, NextResponse } from "next/server";

import { discordConfig, hasDiscordConfig, tebexConfig } from "@/lib/env";
import { setDiscordOAuthState } from "@/lib/discord-auth";

function generateState() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function GET(request: NextRequest) {
  if (!hasDiscordConfig) {
    return NextResponse.json(
      { error: "Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET." },
      { status: 500 },
    );
  }

  const returnTo =
    request.nextUrl.searchParams.get("returnTo") || `${tebexConfig.siteUrl}/`;
  const state = generateState();
  await setDiscordOAuthState(state, returnTo);

  const authorizeUrl = new URL("https://discord.com/api/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", discordConfig.clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", discordConfig.redirectUri);
  authorizeUrl.searchParams.set("scope", "identify");
  authorizeUrl.searchParams.set("prompt", "consent");
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl.toString());
}
