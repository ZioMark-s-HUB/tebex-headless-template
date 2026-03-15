"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Tag,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import Tebex from "@tebexio/tebex.js";
import { toast } from "sonner";

import {
  clearPendingAddPayload,
  clearPendingPackageId,
  ensureClientBasket,
  getPendingAddPayload,
  getPendingPackageId,
} from "@/lib/client-basket";
import { TebexBasket } from "@/types/tebex";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function ensureBasket() {
  return ensureClientBasket();
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

function extractQuantityValue(value: unknown, depth = 0): number {
  if (depth > 4) return 0;
  const direct = toFiniteNumber(value);
  if (direct > 0) return direct;
  if (!value || typeof value !== "object") return 0;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractQuantityValue(entry, depth + 1);
      if (found > 0) return found;
    }
    return 0;
  }
  const record = value as Record<string, unknown>;
  for (const key of ["quantity", "qty", "in_basket"]) {
    const found = extractQuantityValue(record[key], depth + 1);
    if (found > 0) return found;
  }
  return 0;
}

function getCouponCodes(source: unknown): string[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (!entry || typeof entry !== "object") return "";
      const item = entry as Record<string, unknown>;
      const raw = item.coupon_code ?? item.code ?? item.coupon;
      return typeof raw === "string" ? raw.trim() : "";
    })
    .filter(Boolean);
}

function PackageAvatar({ name, imageUrl }: { name: string; imageUrl: string }) {
  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
      style={{ background: `hsl(${hue} 55% 40%)` }}
    >
      {name.trim().charAt(0).toUpperCase() || "P"}
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export function CartClient() {
  const searchParams = useSearchParams();
  const resumeProcessedRef = useRef(false);

  const [basket, setBasket] = useState<TebexBasket | null>(null);
  const [discount, setDiscount] = useState("");
  const [creator, setCreator] = useState("");
  const [appliedDiscountCode, setAppliedDiscountCode] = useState("");
  const [appliedCreatorCode, setAppliedCreatorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [qtyOverride, setQtyOverride] = useState<Record<number, number>>({});
  const [codesOpen, setCodesOpen] = useState(false);
  const [packageLookup, setPackageLookup] = useState<
    Record<number, { name: string; total_price: number; currency?: string; imageUrl: string; disableQuantity?: boolean }>
  >({});

  const getCurrencyCode = () => {
    if (!basket) return "EUR";
    if (typeof basket.currency === "string") return basket.currency;
    return basket.currency?.iso_4217 || "EUR";
  };

  const fmt = (value: number, currency = getCurrencyCode()) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);

  const resolveItem = (item: TebexBasket["packages"][number]) => {
    const packageId = item.package_id ?? item.id ?? 0;
    const packageInfo = packageLookup[packageId];
    const unitPrice = packageInfo?.total_price || 0;
    const rawQty = extractQuantityValue(item);
    const derivedQty =
      unitPrice > 0 && (item.total_price || 0) > 0
        ? Math.max(1, Math.round((item.total_price || 0) / unitPrice))
        : 0;
    const resolvedServerQty = rawQty <= 1 && derivedQty > 1 ? derivedQty : rawQty || derivedQty || 1;
    const qty = qtyOverride[packageId] ?? resolvedServerQty;
    const name =
      typeof item.name === "string"
        ? item.name
        : item.name && typeof item.name === "object" && "name" in item.name
          ? String(item.name.name ?? "")
          : packageInfo?.name || `Package ${packageId}`;
    const currency = packageInfo?.currency || getCurrencyCode();
    const total = item.total_price || (Number.isFinite(unitPrice) ? unitPrice * qty : 0);
    const imageUrl = packageInfo?.imageUrl || "";
    const disableQuantity = Boolean(packageInfo?.disableQuantity);
    const details: string[] = [];
    const qtyObject =
      item.qty && typeof item.qty === "object"
        ? (item.qty as { gift_username_id?: string; gift_username?: string })
        : null;
    if (qtyObject?.gift_username_id) details.push(`Discord ID: ${qtyObject.gift_username_id}`);
    if (qtyObject?.gift_username) details.push(`Gift: ${qtyObject.gift_username}`);
    return { packageId, qty, name, currency, total, imageUrl, disableQuantity, details, unitPrice: qty > 0 ? total / qty : total };
  };

  const loadBasket = async () => {
    const ident = await ensureBasket();
    const res = await fetch(`/api/tebex/basket?basketIdent=${ident}`);
    const payload = (await res.json()) as { data: TebexBasket };
    setBasket(payload.data);
    const coupons = getCouponCodes(payload.data.coupons);
    setAppliedDiscountCode((prev) => coupons[0] || prev);
    const creatorCodeRaw = payload.data.creator_code;
    setAppliedCreatorCode((prev) =>
      typeof creatorCodeRaw === "string" && creatorCodeRaw.trim() ? creatorCodeRaw.trim() : prev,
    );
    setQtyOverride((prev) => {
      const activeIds = new Set((payload.data.packages ?? []).map((item) => item.package_id ?? item.id ?? 0));
      const next: Record<number, number> = {};
      for (const [idRaw, qty] of Object.entries(prev)) {
        const id = Number(idRaw);
        if (activeIds.has(id)) next[id] = qty;
      }
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      const ident = await ensureBasket();
      const res = await fetch(`/api/tebex/basket?basketIdent=${ident}`);
      const payload = (await res.json()) as { data: TebexBasket };
      if (!active) return;
      setBasket(payload.data);
      const coupons = getCouponCodes(payload.data.coupons);
      setAppliedDiscountCode((prev) => coupons[0] || prev);
      const creatorCodeRaw = payload.data.creator_code;
      setAppliedCreatorCode((prev) =>
        typeof creatorCodeRaw === "string" && creatorCodeRaw.trim() ? creatorCodeRaw.trim() : prev,
      );
    };
    void run();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/tebex/listings");
      if (!res.ok) return;
      const payload = (await res.json()) as {
        data?: { packages?: Array<{ id: number; name: string; total_price: number; currency?: string; disable_quantity?: boolean; image?: { url?: string; image?: string; src?: string } | string | null }> };
      };
      const lookup: Record<number, { name: string; total_price: number; currency?: string; imageUrl: string; disableQuantity?: boolean }> = {};
      for (const item of payload.data?.packages ?? []) {
        const image = typeof item.image === "string" ? item.image : item.image?.url ?? item.image?.image ?? item.image?.src ?? "";
        lookup[item.id] = { name: item.name, total_price: item.total_price, currency: item.currency, imageUrl: image, disableQuantity: Boolean(item.disable_quantity) };
      }
      setPackageLookup(lookup);
    };
    void run();
  }, []);

  const redirectToTebexAuth = async (basketIdent: string) => {
    const authRes = await fetch(`/api/tebex/basket/auth-url?basketIdent=${encodeURIComponent(basketIdent)}`);
    if (!authRes.ok) {
      const payload = (await authRes.json().catch(() => ({ error: "Could not start Tebex login" }))) as { error?: string };
      throw new Error(payload.error || "Could not start Tebex login");
    }
    const payload = (await authRes.json()) as { url?: string; error?: string };
    if (!payload.url) throw new Error(payload.error || "Could not start Tebex login");
    window.location.href = payload.url;
  };

  useEffect(() => {
    const successParam = searchParams.get("success");
    if (successParam !== "true" || resumeProcessedRef.current) return;
    resumeProcessedRef.current = true;
    const pendingAdd = getPendingAddPayload();
    const pendingPackageId = pendingAdd?.packageId || getPendingPackageId();
    if (!pendingPackageId) return;
    const run = async () => {
      const basketIdent = await ensureBasket();
      const addRes = await fetch("/api/tebex/basket/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basketIdent, packageId: pendingPackageId, quantity: 1, variableData: pendingAdd?.variableData || {} }),
      });
      if (!addRes.ok) {
        const payload = (await addRes.json().catch(() => ({ error: "Could not resume add to cart" }))) as { error?: string; detail?: string; received?: unknown };
        const rawMessage = payload.detail || payload.error || "";
        const message = rawMessage.toLowerCase();
        if (addRes.status === 422 && message.includes("must login")) { await redirectToTebexAuth(basketIdent); return; }
        if (addRes.status === 400 && message.includes("please enter the")) {
          clearPendingPackageId(); clearPendingAddPayload();
          window.location.href = `/packages/${pendingPackageId}?missingVariable=1&missingVariableDetail=${encodeURIComponent(rawMessage)}`;
          return;
        }
        if (addRes.status >= 500) {
          clearPendingPackageId(); clearPendingAddPayload();
          window.location.href = `/packages/${pendingPackageId}?missingVariable=1&missingVariableDetail=${encodeURIComponent("This package may require additional fields before it can be added to cart.")}`;
          return;
        }
        toast.error(payload.error || "Could not resume add to cart");
        return;
      }
      clearPendingPackageId(); clearPendingAddPayload();
      await loadBasket();
      toast.success("Added to cart");
    };
    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyDiscount = async () => {
    if (!basket || !discount) return;
    setLoading(true);
    const res = await fetch("/api/tebex/basket/discount", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basketIdent: basket.ident, code: discount }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({ error: "Invalid discount code" }))) as { error?: string };
      toast.error(payload.error || "Invalid discount code");
    } else {
      toast.success("Discount code applied");
      setAppliedDiscountCode(discount.trim());
      setDiscount("");
    }
    setLoading(false);
    await loadBasket();
  };

  const applyCreator = async () => {
    if (!basket || !creator) return;
    setLoading(true);
    const res = await fetch("/api/tebex/basket/creator-code", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basketIdent: basket.ident, code: creator }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({ error: "Invalid creator code" }))) as { error?: string };
      toast.error(payload.error || "Invalid creator code");
    } else {
      toast.success("Creator code applied");
      setAppliedCreatorCode(creator.trim());
      setCreator("");
    }
    setLoading(false);
    await loadBasket();
  };

  const removeDiscount = async (code?: string) => {
    if (!basket) return;
    const couponToRemove = code || activeCoupons[0] || appliedDiscountCode;
    setLoading(true);
    const res = await fetch("/api/tebex/basket/discount", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basketIdent: basket.ident, code: couponToRemove }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({ error: "Could not remove coupon code" }))) as { error?: string };
      toast.error(payload.error || "Could not remove coupon code");
    } else {
      toast.success("Coupon code removed");
      setAppliedDiscountCode(""); setDiscount("");
    }
    setLoading(false);
    await loadBasket();
  };

  const removeCreator = async () => {
    if (!basket) return;
    setLoading(true);
    const res = await fetch("/api/tebex/basket/creator-code", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basketIdent: basket.ident }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({ error: "Could not remove creator code" }))) as { error?: string };
      toast.error(payload.error || "Could not remove creator code");
    } else {
      toast.success("Creator code removed");
      setAppliedCreatorCode(""); setCreator("");
    }
    setLoading(false);
    await loadBasket();
  };

  const removeItem = async (packageId: number) => {
    if (!basket || !packageId) return;
    setLoading(true);
    const res = await fetch("/api/tebex/basket/items/remove", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basketIdent: basket.ident, packageId }),
    });
    setLoading(false);
    if (res.ok) {
      setQtyOverride((prev) => { const next = { ...prev }; delete next[packageId]; return next; });
      await loadBasket();
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Item removed");
    } else {
      const payload = (await res.json().catch(() => ({ error: "Could not remove item" }))) as { error?: string };
      toast.error(payload.error || "Could not remove item");
    }
  };

  const updateQty = async (packageId: number, quantity: number, disableQuantity = false) => {
    if (!basket || !packageId || quantity < 1) return;
    if (disableQuantity && quantity > 1) {
      setQtyOverride((prev) => ({ ...prev, [packageId]: 1 }));
      toast.error("This package allows quantity 1 only.");
      return;
    }
    setQtyOverride((prev) => ({ ...prev, [packageId]: quantity }));
    setLoading(true);
    const res = await fetch("/api/tebex/basket/items/quantity", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basketIdent: basket.ident, packageId, quantity }),
    });
    setLoading(false);
    if (res.ok) { await loadBasket(); window.dispatchEvent(new Event("cart-updated")); }
    else {
      setQtyOverride((prev) => { const next = { ...prev }; delete next[packageId]; return next; });
      const payload = (await res.json().catch(() => ({ error: "Could not update quantity" }))) as { error?: string; code?: string };
      if (payload.code === "quantity_locked") setQtyOverride((prev) => ({ ...prev, [packageId]: 1 }));
      toast.error(payload.error || "Could not update quantity");
    }
  };

  const launchCheckout = async () => {
    if (!basket) return;
    setLoading(true);
    const res = await fetch(`/api/tebex/basket/checkout?basketIdent=${basket.ident}`);
    const payload = (await res.json()) as { ident?: string; url: string };
    setLoading(false);
    if (payload.ident) { Tebex.checkout.init({ ident: payload.ident }); Tebex.checkout.launch(); return; }
    window.location.href = payload.url;
  };

  const clearBasket = async () => {
    if (!basket) return;
    setLoading(true);
    clearPendingAddPayload();
    clearPendingPackageId();
    try {
      const packageIds = (basket.packages ?? []).map((item) => item.package_id ?? item.id ?? 0).filter(Boolean);
      for (const id of packageIds) {
        await fetch("/api/tebex/basket/items/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ basketIdent: basket.ident, packageId: id }),
        });
      }
      setQtyOverride({});
      await loadBasket();
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Cart cleared");
    } catch {
      toast.error("Could not clear cart");
    } finally {
      setLoading(false);
    }
  };

  // ─── derived values ──────────────────────────────────────────────────────────
  const resolvedItems = (basket?.packages ?? []).map((item, index) => ({ ...resolveItem(item), key: `${(item.package_id ?? item.id ?? "pkg")}-${index}` }));
  const itemCount = resolvedItems.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = basket?.base_price && basket.base_price > 0 ? basket.base_price : resolvedItems.reduce((acc, item) => acc + item.total, 0);
  const listGross = resolvedItems.reduce((acc, item) => acc + (packageLookup[item.packageId]?.total_price || item.unitPrice) * item.qty, 0);
  const tax = basket?.sales_tax || 0;
  const total = basket?.total_price || 0;
  const basketCoupons = getCouponCodes(basket?.coupons);
  const activeCoupons = basketCoupons.length ? basketCoupons : appliedDiscountCode ? [appliedDiscountCode] : [];
  const basketCreator = typeof basket?.creator_code === "string" ? basket.creator_code.trim() : "";
  const activeCreator = basketCreator || appliedCreatorCode;
  const hasAnyDiscountSource = activeCoupons.length > 0 || Boolean(activeCreator) || (basket?.giftcards?.length ?? 0) > 0;
  const discountAmountRaw = Math.max(0, listGross - total);
  const discountAmount = hasAnyDiscountSource && discountAmountRaw > 0.02 ? discountAmountRaw : 0;
  const discountPercent = listGross > 0 ? Math.min(100, (discountAmount / listGross) * 100) : 0;
  const hasItems = resolvedItems.length > 0;
  const activeCodes = [...activeCoupons, ...(activeCreator ? [activeCreator] : [])];

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cart-item {
          animation: fade-up 0.22s ease-out both;
        }
        .cart-item:nth-child(1) { animation-delay: 0ms; }
        .cart-item:nth-child(2) { animation-delay: 50ms; }
        .cart-item:nth-child(3) { animation-delay: 100ms; }
        .cart-item:nth-child(4) { animation-delay: 150ms; }
        .cart-item:nth-child(5) { animation-delay: 200ms; }
      `}</style>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">

        {/* ── LEFT: items ──────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Your Cart</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {basket
                  ? hasItems
                    ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
                    : "Empty"
                  : "Loading…"}
              </p>
            </div>
            {hasItems && (
              <button
                onClick={clearBasket}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>

          {/* Loading skeleton */}
          {!basket && (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex animate-pulse gap-4 rounded-xl border bg-muted/30 p-4">
                  <div className="h-16 w-16 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {basket && !hasItems && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nothing here yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add some items to get started.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/">Browse packages</Link>
              </Button>
            </div>
          )}

          {/* Item list */}
          {resolvedItems.map((item) => (
            <div
              key={item.key}
              className="cart-item group relative flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <Link href={`/packages/${item.packageId}`} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <PackageAvatar name={item.name} imageUrl={item.imageUrl} />
              </Link>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/packages/${item.packageId}`} className="truncate font-medium leading-tight hover:underline block">{item.name}</Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">{fmt(item.unitPrice, item.currency)} each</p>
                    {item.details.map((d) => (
                      <p key={d} className="text-xs text-muted-foreground">{d}</p>
                    ))}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="min-w-[3rem] text-right font-semibold">{fmt(item.total, item.currency)}</span>
                    <button
                      onClick={() => removeItem(item.packageId)}
                      disabled={loading}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-40"
                      aria-label="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-2">
                  {item.disableQuantity ? (
                    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Qty fixed: 1</span>
                  ) : (
                    <div className="flex items-center rounded-lg border bg-background">
                      <button
                        onClick={() => updateQty(item.packageId, Math.max(1, item.qty - 1), item.disableQuantity)}
                        disabled={loading || item.qty <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 select-none text-center text-sm tabular-nums">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.packageId, item.qty + 1, item.disableQuantity)}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT: order summary ──────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {/* Summary card */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{basket ? fmt(subtotal) : "—"}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-medium text-green-600 dark:text-green-400">
                  <span>Savings ({discountPercent.toFixed(0)}%)</span>
                  <span>−{fmt(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{basket ? fmt(tax) : "—"}</span>
              </div>
              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{basket ? fmt(total) : "—"}</span>
              </div>
            </div>

            {/* Active code pills */}
            {activeCodes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {activeCoupons.map((coupon) => (
                  <span key={coupon} className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                    <Ticket className="h-3 w-3" />
                    {coupon}
                    <button onClick={() => void removeDiscount(coupon)} className="ml-0.5 rounded-full hover:text-red-500" aria-label="Remove">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                {activeCreator && (
                  <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <Tag className="h-3 w-3" />
                    {activeCreator}
                    <button onClick={() => void removeCreator()} className="ml-0.5 rounded-full hover:text-red-500" aria-label="Remove">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Checkout CTA */}
            <Button
              className="mt-5 w-full gap-2 text-sm"
              size="lg"
              onClick={launchCheckout}
              disabled={!basket || !hasItems || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Proceed to checkout <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>

          {/* Promo codes accordion */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/50"
              onClick={() => setCodesOpen((o) => !o)}
            >
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Promo &amp; creator codes
                {activeCodes.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {activeCodes.length}
                  </span>
                )}
              </span>
              <ChevronDown
                className="h-4 w-4 text-muted-foreground transition-transform duration-200"
                style={{ transform: codesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {codesOpen && (
              <div className="space-y-3 border-t px-5 py-4">
                {/* Coupon */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Coupon code</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. SAVE20"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void applyDiscount()}
                      className="h-9 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 px-3"
                      disabled={!discount || loading}
                      onClick={applyDiscount}
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Creator */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Creator code</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Creator username"
                      value={creator}
                      onChange={(e) => setCreator(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void applyCreator()}
                      className="h-9 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 px-3"
                      disabled={!creator || loading}
                      onClick={applyCreator}
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Secure checkout notice */}
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secure checkout powered by Tebex
          </p>
        </div>
      </div>
    </>
  );
}
