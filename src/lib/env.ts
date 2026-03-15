function cleanEnv(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export const tebexConfig = {
  webstoreIdentifier:
    cleanEnv(process.env.NEXT_PUBLIC_TEBEX_WEBSTORE_IDENTIFIER) ||
    cleanEnv(process.env.TEBEX_PUBLIC_TOKEN),
  publicToken: cleanEnv(process.env.TEBEX_PUBLIC_TOKEN),
  privateKey: cleanEnv(process.env.TEBEX_PRIVATE_KEY),
  siteUrl: cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000",
};

export const heroStyle = cleanEnv(process.env.NEXT_PUBLIC_HERO_STYLE) || "1";

export const siteConfig = {
  storeName: cleanEnv(process.env.NEXT_PUBLIC_STORE_NAME) || "Tebex Store",
  supportEmail: cleanEnv(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  discordUrl: cleanEnv(process.env.NEXT_PUBLIC_DISCORD_URL),
  instagramUrl: cleanEnv(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  tiktokUrl: cleanEnv(process.env.NEXT_PUBLIC_TIKTOK_URL),
  twitterUrl: cleanEnv(process.env.NEXT_PUBLIC_TWITTER_URL),
  youtubeUrl: cleanEnv(process.env.NEXT_PUBLIC_YOUTUBE_URL),
  githubUrl: cleanEnv(process.env.NEXT_PUBLIC_GITHUB_URL),
};

export const discordConfig = {
  clientId: cleanEnv(process.env.DISCORD_CLIENT_ID),
  clientSecret: cleanEnv(process.env.DISCORD_CLIENT_SECRET),
  redirectUri:
    cleanEnv(process.env.DISCORD_REDIRECT_URI) ||
    `${cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000"}/api/auth/discord/callback`,
};

export const hasDiscordConfig =
  discordConfig.clientId.length > 0 && discordConfig.clientSecret.length > 0;

export const hasTebexConfig =
  tebexConfig.webstoreIdentifier.length > 0 &&
  tebexConfig.publicToken.length > 0 &&
  tebexConfig.privateKey.length > 0;
