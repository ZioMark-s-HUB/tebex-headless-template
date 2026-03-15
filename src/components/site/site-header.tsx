import Image from "next/image";
import Link from "next/link";

import { CategoriesNavMenu } from "@/components/site/categories-nav-menu";
import { MiniCart } from "@/components/site/mini-cart";
import { MobileMenuButton } from "@/components/site/mobile-menu-button";
import { TebexAuthButton } from "@/components/site/tebex-auth-button";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { hasTebexConfig, siteConfig } from "@/lib/env";
import { getListings } from "@/lib/tebex-server";

export async function SiteHeader() {
  let categories: Array<{ id: number; name: string }> = [];
  if (hasTebexConfig) {
    try {
      const listings = await getListings();
      categories =
        listings?.data.categories.map((item) => ({
          id: item.id,
          name: item.name,
        })) ?? [];
    } catch {
      categories = [];
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <Image
            src="/globe.svg"
            alt="Store logo"
            width={20}
            height={20}
            className="opacity-90"
          />
          <span className="hidden sm:inline">{siteConfig.storeName}</span>
        </Link>

        {/* Desktop nav — pushed left, grows to fill */}
        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main navigation">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Home
          </Link>
          <CategoriesNavMenu categories={categories} />
          <Link
            href="/support"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Support
          </Link>
        </nav>

        {/* Spacer on mobile (no nav visible) */}
        <div className="flex-1 md:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <MiniCart />
          <TebexAuthButton />
          <MobileMenuButton categories={categories} />
        </div>
      </div>
    </header>
  );
}
