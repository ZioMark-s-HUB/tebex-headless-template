"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, LayoutList, Package, SlidersHorizontal } from "lucide-react";

import { TebexPackage } from "@/types/tebex";
import { PackageCard } from "@/components/site/package-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc";
type Layout = "grid" | "list";

type PackagesGridProps = {
  packages: TebexPackage[];
  showDescription?: boolean;
};

const SORT_LABELS: Record<SortOption, string> = {
  default: "Featured",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
  "name-asc": "Name: A → Z",
};

export function PackagesGrid({ packages, showDescription = true }: PackagesGridProps) {
  const currencies = useMemo(() => {
    const values = Array.from(
      new Set(
        packages
          .map((item) => item.currency?.toUpperCase())
          .filter((item): item is string => Boolean(item)),
      ),
    );
    return values.sort();
  }, [packages]);

  const initialCurrency = currencies.includes("EUR") ? "EUR" : (currencies[0] ?? "EUR");

  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  const [sort, setSort] = useState<SortOption>("default");
  const [layout, setLayout] = useState<Layout>("grid");

  const filtered = useMemo(() => {
    let list = currencies.length
      ? packages.filter((item) => (item.currency?.toUpperCase() ?? "EUR") === selectedCurrency)
      : [...packages];

    if (sort === "price-asc") list = [...list].sort((a, b) => (a.total_price ?? 0) - (b.total_price ?? 0));
    else if (sort === "price-desc") list = [...list].sort((a, b) => (b.total_price ?? 0) - (a.total_price ?? 0));
    else if (sort === "name-asc") list = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

    return list;
  }, [currencies.length, packages, selectedCurrency, sort]);

  return (
    <>
      <style>{`
        @keyframes pkg-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pkg-card {
          animation: pkg-in 0.2s ease-out both;
        }
        .pkg-card:nth-child(1)  { animation-delay:  0ms; }
        .pkg-card:nth-child(2)  { animation-delay: 40ms; }
        .pkg-card:nth-child(3)  { animation-delay: 80ms; }
        .pkg-card:nth-child(4)  { animation-delay:120ms; }
        .pkg-card:nth-child(5)  { animation-delay:160ms; }
        .pkg-card:nth-child(6)  { animation-delay:200ms; }
        .pkg-card:nth-child(n+7){ animation-delay:240ms; }
      `}</style>

      <div className="space-y-5">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Left: result count */}
          <p className="text-sm text-muted-foreground">
            {filtered.length === 0
              ? "No packages"
              : `${filtered.length} package${filtered.length === 1 ? "" : "s"}`}
          </p>

          {/* Right: controls */}
          <div className="flex items-center gap-2">

            {/* Currency picker — only show when multiple currencies exist */}
            {currencies.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    {selectedCurrency}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px]">
                  <DropdownMenuRadioGroup value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    {currencies.map((currency) => (
                      <DropdownMenuRadioItem key={currency} value={currency} className="text-sm">
                        {currency}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sort picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 opacity-60" />
                  {SORT_LABELS[sort]}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <DropdownMenuRadioItem key={key} value={key} className="text-sm">
                      {SORT_LABELS[key]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Layout toggle */}
            <div className="flex items-center rounded-lg border bg-background p-0.5">
              <button
                onClick={() => setLayout("grid")}
                aria-label="Grid view"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  layout === "grid"
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setLayout("list")}
                aria-label="List view"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  layout === "list"
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No packages in {selectedCurrency}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try switching to a different currency.
              </p>
            </div>
            {currencies.length > 1 && (
              <div className="flex gap-2">
                {currencies
                  .filter((c) => c !== selectedCurrency)
                  .map((c) => (
                    <Button
                      key={c}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCurrency(c)}
                    >
                      Switch to {c}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Grid / list */}
        {filtered.length > 0 && (
          <div
            className={
              layout === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((item) => (
              <div key={item.id} className="pkg-card">
                <PackageCard
                  item={item}
                  showDescription={showDescription}
                  // Pass layout hint so PackageCard can adapt if it supports it
                  {...(layout === "list" ? { compact: true } : {})}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}