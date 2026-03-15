"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Settings2, ShoppingCart, Tag } from "lucide-react";

import { TebexPackage } from "@/types/tebex";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { Button } from "@/components/ui/button";

type PackageCardProps = {
  item: TebexPackage;
  showDescription?: boolean;
  compact?: boolean;
};

function sanitizePackageHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

function PackageAvatar({ name, hue }: { name: string; hue: number }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center text-3xl font-bold text-white/80 select-none"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 50% 35%), hsl(${(hue + 40) % 360} 55% 25%))`,
      }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function PackageCard({ item, showDescription = true, compact = false }: PackageCardProps) {
  const imageUrl =
    typeof item.image === "string"
      ? item.image
      : item.image?.url ?? item.image?.image ?? item.image?.src ?? "";

  const requiresConfiguration =
    (item.variables || []).length > 0;

  const hue = item.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.currency || "EUR",
  }).format(item.total_price);

  // ── Compact (list) layout ─────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="group flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <Image src={imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
          ) : (
            <PackageAvatar name={item.name} hue={hue} />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium leading-tight">{item.name}</p>
            <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-foreground">{price}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Tag className="h-2.5 w-2.5" />
              {item.category?.name ?? "General"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label={`View ${item.name}`}>
            <Link href={`/packages/${item.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {requiresConfiguration ? (
            <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
              <Link href={`/packages/${item.id}?missingVariable=1`}>
                <Settings2 className="h-3.5 w-3.5" />
                Configure
              </Link>
            </Button>
          ) : (
            <AddToCartButton packageId={item.id} variables={item.variables} compact />
          )}
        </div>
      </div>
    );
  }

  // ── Grid (card) layout ────────────────────────────────────────────────────
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">

      {/* Image / thumbnail */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <PackageAvatar name={item.name} hue={hue} />
        )}

        {/* Overlay: quick-view on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
          <Link
            href={`/packages/${item.id}`}
            className="flex translate-y-2 items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Eye className="h-3.5 w-3.5" />
            Quick view
          </Link>
        </div>

        {/* Category badge — top left */}
        <div className="absolute left-3 top-3">
          <span className="flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
            <Tag className="h-2.5 w-2.5 text-muted-foreground" />
            {item.category?.name ?? "General"}
          </span>
        </div>

        {/* Price badge — top right */}
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground tabular-nums shadow-sm">
            {price}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-1 font-semibold leading-tight">{item.name}</h3>

        {showDescription && (
          <div
            className="line-clamp-2 text-sm leading-relaxed text-muted-foreground [&_p]:m-0"
            dangerouslySetInnerHTML={{
              __html: sanitizePackageHtml(item.description || "<p>No description provided.</p>"),
            }}
          />
        )}

        {/* Spacer so footer always sticks to bottom */}
        <div className="flex-1" />

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            asChild
            aria-label={`View ${item.name}`}
          >
            <Link href={`/packages/${item.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

          {requiresConfiguration ? (
            <Button asChild className="h-9 flex-1 gap-2 text-sm">
              <Link href={`/packages/${item.id}?missingVariable=1`}>
                <Settings2 className="h-4 w-4" />
                Configure
              </Link>
            </Button>
          ) : (
            <div className="flex-1">
              <AddToCartButton packageId={item.id} variables={item.variables}  />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}