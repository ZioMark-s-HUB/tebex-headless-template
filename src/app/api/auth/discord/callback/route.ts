import { NextRequest, NextResponse } from "next/server";

import { clearDiscordOAuthState, readDiscordOAuthState } from "@/lib/discord-auth";
import { discordConfig, hasDiscordConfig, tebexConfig } from "@/lib/env";

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
};

type DiscordUserResponse = {
  id: string;
  username: string;
  avatar: string | null;
};

export async function GET(request: NextRequest) {
  const fallback = `${tebexConfig.siteUrl}/`;
  if (!hasDiscordConfig) {
    return NextResponse.redirect(`${fallback}?discord=not-configured`);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") || "";
  const oauth = await readDiscordOAuthState();
  const returnTo = oauth.returnTo || fallback;
  await clearDiscordOAuthState();

  if (!code || !state || state !== oauth.state) {
    return NextResponse.redirect(`${returnTo}?discord=invalid-state`);
  }

  const body = new URLSearchParams();
  body.set("client_id", discordConfig.clientId);
  body.set("client_secret", discordConfig.clientSecret);
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", discordConfig.redirectUri);

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${returnTo}?discord=token-failed`);
  }

  const token = (await tokenRes.json()) as DiscordTokenResponse;
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });

  if (!userRes.ok) {
    return NextResponse.redirect(`${returnTo}?discord=user-failed`);
  }

  const user = (await userRes.json()) as DiscordUserResponse;

  // Pass Discord data back via URL params — stored in sessionStorage by the client,
  // not persisted in cookies. This makes Discord auth ephemeral per tab/session.
  const redirectUrl = new URL(returnTo);
  redirectUrl.searchParams.set("discord", "ok");
  redirectUrl.searchParams.set("discord_id", user.id);
  redirectUrl.searchParams.set("discord_username", user.username);
  if (user.avatar) redirectUrl.searchParams.set("discord_avatar", user.avatar);

  return NextResponse.redirect(redirectUrl.toString());
}
