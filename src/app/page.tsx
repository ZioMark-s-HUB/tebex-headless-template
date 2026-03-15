import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";

import { hasTebexConfig } from "@/lib/env";
import { getListings } from "@/lib/tebex-server";
import { HeroSection } from "@/components/site/hero-section";
import { PackagesGrid } from "@/components/site/packages-grid";

export default async function Home() {
  let listings = null;
  let listingsError = "";

  if (hasTebexConfig) {
    try {
      listings = await getListings();
    } catch (error) {
      listingsError = error instanceof Error ? error.message : "Unknown Tebex API error";
    }
  }

  const packages = listings?.data?.packages?.slice(0, 6) ?? [];
  const categories = listings?.data?.categories ?? [];
  const totalPackages = listings?.data?.packages?.length ?? 0;

  return (
    <div className="space-y-16">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection totalPackages={totalPackages} categoryCount={categories.length} />

      {/* ── Config warning ───────────────────────────────────────────────── */}
      {!hasTebexConfig && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
          <span className="mt-0.5 text-base">⚠</span>
          <span>
            Missing Tebex environment variables. Add{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono dark:bg-amber-900/50">TEBEX_PUBLIC_TOKEN</code>{" "}
            and{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono dark:bg-amber-900/50">TEBEX_PRIVATE_KEY</code>{" "}
            to load live listings.
          </span>
        </div>
      )}

      {/* ── API error ────────────────────────────────────────────────────── */}
      {hasTebexConfig && listingsError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span className="mt-0.5">⚠</span>
          Could not load listings: {listingsError}
        </div>
      )}

      {/* ── Category quick-links ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Link
              href="/categories"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const hue = cat.name.split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % 360;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium transition-all hover:-translate-y-px hover:shadow-sm"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: `hsl(${hue} 55% 48%)` }}
                  />
                  {cat.name}
                  <span className="text-muted-foreground">
                    {cat.packages?.length ?? 0}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Featured packages ────────────────────────────────────────────── */}
      {packages.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Featured Packages</h2>
            </div>
            <Link
              href="/categories"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <PackagesGrid packages={packages} showDescription={false} />
        </section>
      )}
    </div>
  );
}