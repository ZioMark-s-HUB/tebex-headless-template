import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Tag } from "lucide-react";

import { hasTebexConfig } from "@/lib/env";
import { getCategoryById, getListings } from "@/lib/tebex-server";
import { PackagesGrid } from "@/components/site/packages-grid";

type CategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isFinite(categoryId)) notFound();

  let category = null;
  let categories: Array<{ id: number; name: string }> = [];
  let error = "";

  if (hasTebexConfig) {
    try {
      const [one, all] = await Promise.all([getCategoryById(categoryId), getListings()]);
      category = one;
      categories = all?.data.categories.map((item) => ({ id: item.id, name: item.name })) ?? [];
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown Tebex API error";
    }
  }

  if (!category && !error) notFound();

  const pkgCount = category?.packages?.length ?? 0;
  // Deterministic hue for the category hero accent
  const hue = (category?.name ?? "")
    .split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="space-y-8">

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-10 sm:px-10">
        {/* Hue-tinted overlay — transparent enough to let bg-card show through in both modes */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 60% 50% / 0.08) 0%, hsl(${(hue + 30) % 360} 55% 50% / 0.05) 100%)`,
          }}
        />

        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ background: `hsl(${hue} 70% 60%)` }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full opacity-10 blur-2xl"
          style={{ background: `hsl(${(hue + 60) % 360} 60% 55%)` }}
        />

        {/* Back link */}
        <Link
          href="/categories"
          className="relative mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All categories
        </Link>

        <div className="relative flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: `hsl(${hue} 55% 45%)` }}
              >
                <Tag className="h-4 w-4" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {category?.name ?? "Category"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {pkgCount > 0
                ? `${pkgCount} package${pkgCount === 1 ? "" : "s"} available`
                : "No packages yet"}
            </p>
          </div>
        </div>
      </section>

      {/* ── Sibling category pills ────────────────────────────────────────── */}
      {categories.length > 1 && (
        <section className="flex flex-wrap gap-2" aria-label="Browse categories">
          {categories.map((item) => {
            const active = item.id === categoryId;
            return (
              <Link
                key={item.id}
                href={`/category/${item.id}`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </section>
      )}

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span className="mt-0.5 text-base">⚠</span>
          <span>Could not load category: {error}</span>
        </div>
      )}

      {/* ── Packages ─────────────────────────────────────────────────────── */}
      {category && pkgCount > 0 && <PackagesGrid packages={category.packages} />}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {category && pkgCount === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No packages in this category yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon or browse another category.
            </p>
          </div>
          <Link
            href="/categories"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Browse all categories
          </Link>
        </div>
      )}
    </div>
  );
}