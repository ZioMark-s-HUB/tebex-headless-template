"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import {
  clearPendingAddPayload,
  clearPendingPackageId,
  clearStoredBasketIdent,
  ensureClientBasket,
  getPendingAddPayload,
  getPendingPackageId,
  setPendingAddPayload,
  setPendingPackageId,
} from "@/lib/client-basket";
import { TebexPackageVariable } from "@/types/tebex";
import { Button } from "@/components/ui/button";

type AddToCartError = {
  status: number;
  message: string;
};

async function redirectToTebexAuth(basketIdent: string, packageId: number) {
  const returnUrl = encodeURIComponent(`${window.location.origin}/packages/${packageId}`);
  const authRes = await fetch(`/api/tebex/basket/auth-url?basketIdent=${encodeURIComponent(basketIdent)}&returnUrl=${returnUrl}`);
  if (!authRes.ok) {
    const payload = (await authRes.json().catch(() => ({ error: "Could not start Tebex login" }))) as { error?: string };
    throw new Error(payload.error || "Could not start Tebex login");
  }
  const payload = (await authRes.json()) as { url?: string; error?: string };
  if (!payload.url) throw new Error(payload.error || "Could not start Tebex login");
  window.location.href = payload.url;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function requiresTebexLogin(message: string) {
  const l = message.toLowerCase();
  return l.includes("user must login") || l.includes("must login");
}

function requiresVariables(message: string) {
  return message.toLowerCase().includes("please enter the");
}

function redirectToVariableConfig(packageId: number, message: string) {
  // Pre-set the discord requirement flag so the purchase panel shows it immediately
  if (message.toLowerCase().includes("discord")) {
    try { window.localStorage.setItem(`tebex_package_requires_discord_${packageId}`, "1"); } catch { /* ignore */ }
  }
  window.location.href = `/packages/${packageId}?missingVariable=1&missingVariableDetail=${encodeURIComponent(message)}`;
}

export function AddToCartButton({
  packageId,
  variables,
  variableData,
  disabled = false,
  redirectToCart = true,
  compact = false,
}: {
  packageId: number;
  variables?: TebexPackageVariable[];
  variableData?: Record<string, string>;
  disabled?: boolean;
  redirectToCart?: boolean;
  compact?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const hasPackageVariables = (variables?.length ?? 0) > 0;
  const hasVariableData = Boolean(
    variableData && Object.values(variableData).some((v) => Boolean((v || "").trim())),
  );

  const addWithBasket = async (basketIdent: string): Promise<AddToCartError | null> => {
    const res = await fetch("/api/tebex/basket/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basketIdent, packageId, quantity: 1, variableData }),
    });
    if (res.ok) return null;
    const payload = (await res.json().catch(() => ({ error: "Could not add item" }))) as { error?: string; detail?: string };
    return { status: res.status, message: payload.detail || payload.error || "Could not add item" };
  };

  /**
   * Handles the result of any add attempt — shared logic so every code path
   * (first attempt, 500-retry, 404-fresh-basket retry) behaves consistently.
   *
   * Returns true if the caller should stop (either success or a redirect was
   * triggered), false if the caller should fall through to its own error handling.
   */
  const handleAddResult = async (
    err: AddToCartError | null,
    basketIdent: string,
  ): Promise<boolean> => {
    if (!err) {
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart");
      if (redirectToCart) window.location.href = "/cart";
      return true;
    }

    // Tebex requires login
    if (err.status === 422 && requiresTebexLogin(err.message)) {
      setPendingAddPayload({ packageId, variableData });
      setPendingPackageId(packageId);
      await redirectToTebexAuth(basketIdent, packageId);
      return true;
    }

    // Package requires variables (missing Discord ID, username, etc.)
    // Tebex sometimes returns 500 on the first hit and 400 on the retry for
    // the exact same missing-variable error, so we handle it in both paths.
    if (
      (err.status === 400 || err.status === 500) &&
      requiresVariables(err.message)
    ) {
      if (!hasVariableData) {
        redirectToVariableConfig(packageId, err.message);
        return true;
      }
      toast.error("Required package fields are missing or invalid. Please check the values.");
      return true;
    }

    return false;
  };

  const addToCart = async () => {
    if (hasPackageVariables && !hasVariableData) {
      redirectToVariableConfig(packageId, "This package requires additional fields before it can be added to cart.");
      return;
    }

    setIsLoading(true);
    try {
      const basketIdent = await ensureClientBasket();

      // ── First attempt ──────────────────────────────────────────────────
      const firstErr = await addWithBasket(basketIdent);
      if (await handleAddResult(firstErr, basketIdent)) return;

      // ── 500: Tebex server error — retry once after a short delay ───────
      // Known Tebex behaviour: packages with required variables return 500 on
      // the first call, then 400 with the actual detail message on the retry.
      if (firstErr && firstErr.status >= 500) {
        await sleep(400);
        const retryErr = await addWithBasket(basketIdent);

        // The retry might now return the proper 400 with variable details
        if (await handleAddResult(retryErr, basketIdent)) return;

        // Still failing after retry — surface the clearest message available
        const displayMessage =
          retryErr?.message && retryErr.message !== "Could not add item"
            ? retryErr.message
            : firstErr.message && firstErr.message !== "Could not add item"
              ? firstErr.message
              : "Tebex is temporarily unavailable. Please try again.";

        // Tebex returns generic 500 for server-side requirements (e.g. Discord)
        // that may not be listed in the package variables. Always redirect to
        // the package detail page where the purchase panel can handle it.
        if (retryErr?.status === 500 || firstErr.status === 500) {
          redirectToVariableConfig(
            packageId,
            "This package may require additional configuration before it can be added to cart.",
          );
          return;
        }

        toast.error(displayMessage);
        return;
      }

      // ── 404: basket expired — create a fresh one and retry ────────────
      if (firstErr && firstErr.status === 404) {
        clearStoredBasketIdent();
        const freshBasket = await ensureClientBasket();
        const retryErr = await addWithBasket(freshBasket);
        if (await handleAddResult(retryErr, freshBasket)) return;
        toast.error(retryErr?.message ?? firstErr.message);
        return;
      }

      // ── Any other error ────────────────────────────────────────────────
      toast.error(firstErr?.message ?? "Could not add item");
    } catch (error) {
      // Clean up any stale pending state for this package
      if (getPendingAddPayload()?.packageId === packageId) clearPendingAddPayload();
      if (getPendingPackageId() === packageId) clearPendingPackageId();

      const msg = error instanceof Error ? error.message : "";
      // Basket creation failed — redirect to package page where the user
      // can log in via the purchase panel and retry from there.
      if (msg.includes("Could not create basket")) {
        toast.error("Please log in to add items to your cart.");
        window.location.href = `/packages/${packageId}`;
        return;
      }
      toast.error(msg || "Could not add item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        onClick={addToCart}
        disabled={isLoading || disabled}
        className={`w-full gap-2 ${compact ? "h-8 px-2 text-xs" : ""}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {isLoading ? "Adding…" : "Add to Cart"}
      </Button>
    </div>
  );
}
