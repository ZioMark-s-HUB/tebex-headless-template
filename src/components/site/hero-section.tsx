import Link from "next/link";
import { ArrowRight, ShoppingCart, Sparkles, Store, Zap } from "lucide-react";

import { heroStyle, siteConfig } from "@/lib/env";

type HeroProps = {
  totalPackages: number;
  categoryCount: number;
};

/**
 * Style 1 — Card with dot-grid background, left-aligned text, stats strip.
 */
function HeroStyle1({ totalPackages, categoryCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-card px-8 py-14 sm:px-14 sm:py-20">
      {/* Background mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-primary/6 blur-2xl" />
        <div className="absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-primary/5 blur-xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative space-y-6 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          <Zap className="h-3 w-3 text-primary" />
          {siteConfig.storeName}
        </span>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your store,{" "}
            <span className="relative inline-block">
              your way
              <span
                className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary opacity-70"
                aria-hidden="true"
              />
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            A fully custom storefront powered by Next.js, shadcn/ui, and the Tebex Headless API —
            with embedded checkout, real-time cart, and Discord integration.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          >
            Browse categories
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-xl border bg-background px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          >
            <ShoppingCart className="h-4 w-4" />
            Go to cart
          </Link>
        </div>
      </div>

      {(categoryCount > 0 || totalPackages > 0) && (
        <div className="relative mt-10 flex flex-wrap gap-6 border-t pt-6">
          {totalPackages > 0 && (
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalPackages}</p>
              <p className="text-xs text-muted-foreground">Packages available</p>
            </div>
          )}
          {categoryCount > 0 && (
            <div>
              <p className="text-2xl font-bold tabular-nums">{categoryCount}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Style 2 — Centered text, gradient border glow, no card background.
 */
function HeroStyle2({ totalPackages, categoryCount }: HeroProps) {
  return (
    <section className="relative flex flex-col items-center px-4 py-16 text-center sm:py-24">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative space-y-6 max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
          <Store className="h-3 w-3 text-primary" />
          {siteConfig.storeName}
        </span>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {siteConfig.storeName}
          </span>
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Browse our collection, add items to your cart, and check out seamlessly — all in one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          >
            Start shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-xl border bg-background px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          >
            <ShoppingCart className="h-4 w-4" />
            View cart
          </Link>
        </div>

        {(categoryCount > 0 || totalPackages > 0) && (
          <div className="flex items-center justify-center gap-8 pt-6 text-sm text-muted-foreground">
            {totalPackages > 0 && (
              <span><strong className="font-semibold text-foreground tabular-nums">{totalPackages}</strong> packages</span>
            )}
            {categoryCount > 0 && (
              <span><strong className="font-semibold text-foreground tabular-nums">{categoryCount}</strong> categories</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Style 3 — Minimal compact banner, single row on desktop.
 */
function HeroStyle3({ totalPackages }: HeroProps) {
  return (
    <section className="rounded-2xl border bg-card px-6 py-6 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">{siteConfig.storeName}</h1>
            {totalPackages > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {totalPackages} items
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Browse our packages and check out instantly.
          </p>
        </div>

        <div className="flex flex-shrink-0 gap-2">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:shadow-sm"
          >
            Browse
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-all hover:-translate-y-px hover:shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Cart
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HeroSection(props: HeroProps) {
  switch (heroStyle) {
    case "hidden":
      return null;
    case "2":
      return <HeroStyle2 {...props} />;
    case "3":
      return <HeroStyle3 {...props} />;
    default:
      return <HeroStyle1 {...props} />;
  }
}
