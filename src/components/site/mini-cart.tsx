"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ShoppingCart, Package, ArrowRight, Loader2, X } from "lucide-react";

import { getStoredBasketIdent, ensureClientBasket } from "@/lib/client-basket";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BasketPayload = {
  data?: {
    ident: string;
    total_price?: number;
    currency?: string | { iso_4217?: string; symbol?: string };
    links?: { checkout?: string };
    packages?: Array<{
      id?: number;
      package_id?: number;
      name?: string | { name?: string };
      image?: string | { url?: string; image?: string; src?: string } | null;
      quantity?: number | { quantity?: number };
      qty?: number;
      in_basket?: number;
      base_price?: number;
      price?: number;
    }>;
  };
};

function readQty(item: {
  quantity?: number | { quantity?: number };
  qty?: number | { quantity?: number; price?: number; gift_username_id?: string; gift_username?: string };
  in_basket?: number;
}) {
  const toFiniteNumber = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const fromQuantityNumber = toFiniteNumber(item.quantity);
  const fromQuantityObject =
    typeof item.quantity === "object" && item.quantity
      ? toFiniteNumber(item.quantity.quantity)
      : 0;
  const fromQtyNumber = toFiniteNumber(item.qty);
  const fromQtyObject =
    typeof item.qty === "object" && item.qty
      ? toFiniteNumber(item.qty.quantity)
      : 0;
  const fromInBasket = toFiniteNumber(item.in_basket);

  const resolved =
    fromQuantityNumber ||
    fromQuantityObject ||
    fromQtyNumber ||
    fromQtyObject ||
    fromInBasket;

  return resolved > 0 ? resolved : 1;
}

function readName(item: { name?: string | { name?: string }; id?: number; package_id?: number }) {
  if (typeof item.name === "string") return item.name;
  if (item.name && typeof item.name === "object" && typeof item.name.name === "string") {
    return item.name.name;
  }
  return `Package ${item.id ?? item.package_id ?? ""}`.trim();
}

function readPrice(item: { base_price?: number; price?: number }) {
  return item.base_price ?? item.price ?? null;
}

function CartBadge({ count }: { count: number }) {
  return (
    <span
      key={count}
      className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums transition-transform duration-200"
      style={{
        animation: count > 0 ? "badge-pop 0.25s cubic-bezier(0.34,1.56,0.64,1)" : "none",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-lg shadow-sm">
          ✦
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Your cart is empty</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Add items to get started</p>
      </div>
    </div>
  );
}

function resolveImageUrl(img: string | { url?: string; image?: string; src?: string } | null | undefined): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.url ?? img.image ?? img.src ?? "";
}

function PackageThumbnail({ name, image }: { name: string; image?: string | { url?: string; image?: string; src?: string } | null }) {
  const src = resolveImageUrl(image);
  const initial = name.trim().charAt(0).toUpperCase() || "P";
  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  if (src) {
    return (
      <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="32px"
        />
      </span>
    );
  }

  return (
    <span
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
      style={{ background: `hsl(${hue} 60% 45%)` }}
    >
      {initial}
    </span>
  );
}

export function MiniCart() {
  const [basket, setBasket] = useState<BasketPayload["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(0);

  const packages = basket?.packages ?? [];
  const count = packages.reduce((acc, item) => acc + readQty(item), 0);

  const currencyCode =
    !basket?.currency
      ? "EUR"
      : typeof basket.currency === "string"
        ? basket.currency
        : basket.currency.iso_4217 || "EUR";

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(amount);

  const refreshBasket = async () => {
    const basketIdent = getStoredBasketIdent();
    if (!basketIdent) {
      setBasket(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tebex/basket?basketIdent=${encodeURIComponent(basketIdent)}`);
      if (res.ok) {
        const payload = (await res.json()) as BasketPayload;
        setBasket(payload.data || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (packageId: number) => {
    const basketIdent = getStoredBasketIdent();
    if (!basketIdent || !packageId) return;
    setLoading(true);
    try {
      await fetch("/api/tebex/basket/items/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basketIdent, packageId }),
      });
      await refreshBasket();
      window.dispatchEvent(new Event("cart-updated"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  useEffect(() => {
    const timer = setTimeout(() => void refreshBasket(), 0);
    const onUpdate = () => void refreshBasket();
    window.addEventListener("cart-updated", onUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("cart-updated", onUpdate);
    };
  }, []);

  const visiblePackages = packages.slice(0, 5);
  const overflow = packages.length - visiblePackages.length;

  return (
    <>
      <style>{`
        @keyframes badge-pop {
          0% { transform: scale(0.5); }
          100% { transform: scale(1); }
        }
        @keyframes cart-slide-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .cart-dropdown-content {
          animation: cart-slide-in 0.18s ease-out both;
        }
      `}</style>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2 pr-3"
            aria-label={`Open cart, ${count} items`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && <CartBadge count={count} />}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="cart-dropdown-content w-80 overflow-hidden rounded-xl p-0 shadow-xl"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              {count > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close cart"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {packages.length === 0 ? (
              <EmptyCart />
            ) : (
              <ul className="divide-y">
                {visiblePackages.map((item, index) => {
                  const name = readName(item);
                  const qty = readQty(item);
                  const price = readPrice(item);
                  const packageId = item.package_id ?? item.id ?? 0;
                  return (
                    <li
                      key={`${packageId || item.name || "pkg"}-${index}`}
                      className="group/item flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <Link href={`/packages/${packageId}`} onClick={() => setOpen(false)}>
                        <PackageThumbnail name={name} image={item.image} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/packages/${packageId}`} onClick={() => setOpen(false)} className="line-clamp-1 text-sm font-medium leading-tight hover:underline">{name}</Link>
                        {price !== null && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{fmt(price)}</p>
                        )}
                      </div>
                      <span className="flex-shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                        ×{qty}
                      </span>
                      <button
                        onClick={() => void removeItem(packageId)}
                        disabled={loading || !packageId}
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100 disabled:opacity-30"
                        aria-label={`Remove ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
                {overflow > 0 && (
                  <li className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    +{overflow} more item{overflow > 1 ? "s" : ""}
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Footer */}
          {packages.length > 0 && (
            <div className="border-t bg-muted/30 px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="text-sm font-semibold tabular-nums">
                  {fmt(basket?.total_price || 0)}
                </span>
              </div>
              <div className="grid gap-2">
                {basket?.links?.checkout ? (
                  <>
                    <Button asChild size="sm" className="w-full gap-1.5">
                      <a href={basket.links.checkout}>
                        Checkout
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
                      <Link href="/cart">View full cart</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild size="sm" className="w-full gap-1.5">
                    <Link href="/cart">
                      View cart
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}