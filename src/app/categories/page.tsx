import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Folders, Package, Tag } from "lucide-react";

import { hasTebexConfig } from "@/lib/env";
import { getListings } from "@/lib/tebex-server";

// ─── Optional per-category images ────────────────────────────────────────────
// Tebex doesn't provide category images, so map your category IDs to an image
// URL (remote) or a local /public path here.
// Any category not listed falls back to the coloured gradient band.
//
// How to find your category IDs:
//   → Open /categories in your storefront and hover/inspect each card link.
//     The number in /category/[ID] is the ID you need.
//
// Examples:
//   2627718: "/images/categories/vip.jpg",          // file in /public
//   2627718: "https://cdn.example.com/ranks.png",   // remote URL (add host to next.config)
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_IMAGES: Record<number, string> = {
  // 2627718: "/images/categories/vip.jpg",
  // 2627718: "https://cdn.example.com/ranks.png",
};

export default async function CategoriesPage() {
  let listings = null;
  let listingsError = "";

  if (hasTebexConfig) {
    try {
      listings = await getListings();
    } catch (error) {
      listingsError = error instanceof Error ? error.message : "Unknown Tebex API error";
    }
  }

  const categories = listings?.data?.categories ?? [];
  const totalPackages = categories.reduce((acc, c) => acc + (c.packages?.length ?? 0), 0);

  return (
    <div className="space-y-10">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
        <p className="text-sm text-muted-foreground">
          {categories.length > 0
            ? `${categories.length} categor${categories.length === 1 ? "y" : "ies"} · ${totalPackages} package${totalPackages === 1 ? "" : "s"} total`
            : "Browse packages by category."}
        </p>
      </section>

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {listingsError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span className="mt-0.5">⚠</span>
          Could not load categories: {listingsError}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!listingsError && categories.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Folders className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No categories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure your Tebex env vars or publish listings in your webstore.
            </p>
          </div>
        </div>
      )}

      {/* ── Category grid ─────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const hue = category.name
              .split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % 360;
            const pkgCount = category.packages?.length ?? 0;
            const imageUrl = CATEGORY_IMAGES[category.id] ?? "";

            return (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* ── Band: image or gradient fallback ─────────────────── */}
                <div className="relative h-24 w-full overflow-hidden">

                  {imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Dark scrim — keeps icon + badge readable over any image */}
                      <div className="absolute inset-0 bg-black/30 transition-opacity duration-200 group-hover:bg-black/20" />
                    </>
                  ) : (
                    <>
                      {/* bg-muted as the base so it's dark-mode aware */}
                      <div className="absolute inset-0 bg-muted" />
                      {/* Hue tint overlay — semi-transparent so bg-muted shows through */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, hsl(${hue} 60% 50% / 0.18) 0%, hsl(${(hue + 40) % 360} 55% 50% / 0.10) 100%)`,
                        }}
                      />
                      {/* Decorative blob */}
                      <div
                        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-45"
                        style={{ background: `hsl(${hue} 65% 55%)` }}
                      />
                    </>
                  )}

                  {/* Icon — bottom-left, always on top */}
                  <div className="absolute bottom-3 left-4 z-10">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: `hsl(${hue} 55% 42%)` }}
                    >
                      <Tag className="h-[18px] w-[18px]" />
                    </span>
                  </div>

                  {/* Package count badge — bottom-right, always on top */}
                  <div className="absolute bottom-3 right-4 z-10">
                    <span className="flex items-center gap-1 rounded-full bg-background/75 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      {pkgCount}
                    </span>
                  </div>
                </div>

                {/* ── Body ─────────────────────────────────────────────── */}
                <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">{category.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pkgCount} package{pkgCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}