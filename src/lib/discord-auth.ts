import { cookies } from "next/headers";

const DISCORD_USER_ID = "discord_user_id";
const DISCORD_USERNAME = "discord_username";
const DISCORD_AVATAR = "discord_avatar";
const DISCORD_OAUTH_STATE = "discord_oauth_state";
const DISCORD_OAUTH_RETURN = "discord_oauth_return_to";

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

export async function setDiscordOAuthState(state: string, returnTo: string) {
  const store = await cookies();
  store.set(DISCORD_OAUTH_STATE, state, cookieOptions(60 * 10));
  store.set(DISCORD_OAUTH_RETURN, returnTo, cookieOptions(60 * 10));
}

export async function readDiscordOAuthState() {
  const store = await cookies();
  return {
    state: store.get(DISCORD_OAUTH_STATE)?.value ?? "",
    returnTo: store.get(DISCORD_OAUTH_RETURN)?.value ?? "",
  };
}

export async function clearDiscordOAuthState() {
  const store = await cookies();
  store.delete(DISCORD_OAUTH_STATE);
  store.delete(DISCORD_OAUTH_RETURN);
}

export async function setDiscordUserSession(user: {
  id: string;
  username: string;
  avatar?: string | null;
}) {
  const store = await cookies();
  // Session cookies (no maxAge): cleared by browser when session ends.
  store.set(DISCORD_USER_ID, user.id, cookieOptions());
  store.set(DISCORD_USERNAME, user.username, cookieOptions());
  store.set(DISCORD_AVATAR, user.avatar || "", cookieOptions());
}

export async function getDiscordUserSession() {
  const store = await cookies();
  const id = store.get(DISCORD_USER_ID)?.value ?? "";
  const username = store.get(DISCORD_USERNAME)?.value ?? "";
  const avatar = store.get(DISCORD_AVATAR)?.value ?? "";
  if (!id) return null;
  return { id, username, avatar: avatar || null };
}

export async function clearDiscordUserSession() {
  const store = await cookies();
  store.delete(DISCORD_USER_ID);
  store.delete(DISCORD_USERNAME);
  store.delete(DISCORD_AVATAR);
}
