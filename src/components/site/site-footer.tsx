import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

import { siteConfig } from "@/lib/env";

type SocialLink = { label: string; url: string; icon: ReactNode };

const iconClass = "h-4 w-4";

function DiscordIcon() {
  return (
    <svg viewBox="0 0 127.14 96.36" aria-hidden="true" className={iconClass} fill="currentColor">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.74 56.6.54 80.2a105.73 105.73 0 0 0 32.17 16.16 77.7 77.7 0 0 0 6.89-11.28 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.35 2.66-2.08 20.87 9.56 43.58 9.56 64.21 0 .87.73 1.76 1.42 2.67 2.08a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.27 105.25 105.25 0 0 0 32.19-16.16c2.67-27.34-4.61-51.07-18.8-72.13ZM42.45 65.69c-6.27 0-11.42-5.73-11.42-12.8s5-12.8 11.42-12.8c6.46 0 11.52 5.76 11.42 12.8.01 7.07-5.04 12.8-11.42 12.8Zm42.24 0c-6.27 0-11.42-5.73-11.42-12.8s5-12.8 11.42-12.8c6.46 0 11.52 5.76 11.42 12.8 0 7.07-5.04 12.8-11.42 12.8Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.7a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [];
  if (siteConfig.discordUrl) links.push({ label: "Discord", url: siteConfig.discordUrl, icon: <DiscordIcon /> });
  if (siteConfig.twitterUrl) links.push({ label: "Twitter", url: siteConfig.twitterUrl, icon: <TwitterIcon /> });
  if (siteConfig.youtubeUrl) links.push({ label: "YouTube", url: siteConfig.youtubeUrl, icon: <YouTubeIcon /> });
  if (siteConfig.instagramUrl) links.push({ label: "Instagram", url: siteConfig.instagramUrl, icon: <InstagramIcon /> });
  if (siteConfig.tiktokUrl) links.push({ label: "TikTok", url: siteConfig.tiktokUrl, icon: <TikTokIcon /> });
  if (siteConfig.githubUrl) links.push({ label: "GitHub", url: siteConfig.githubUrl, icon: <GitHubIcon /> });
  return links;
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const socials = getSocialLinks();

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-6">
        {/* Left — logo + copyright */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Image src="/globe.svg" alt="Store logo" width={14} height={14} className="opacity-80" />
            </span>
            {siteConfig.storeName}
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            &copy; {year} All rights reserved.
          </span>
        </div>

        {/* Right — social icons */}
        {socials.length > 0 && (
          <div className="flex items-center gap-1">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        )}

        {/* Mobile copyright */}
        <span className="text-xs text-muted-foreground sm:hidden">
          &copy; {year} All rights reserved.
        </span>
      </div>
    </footer>
  );
}
