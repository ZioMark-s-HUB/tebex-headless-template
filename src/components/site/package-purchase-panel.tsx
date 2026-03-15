"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Loader2, LogIn, ShoppingCart, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { ensureClientBasket, getStoredBasketIdent } from "@/lib/client-basket";
import { TebexPackageVariable } from "@/types/tebex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types & helpers ──────────────────────────────────────────────────────────

type PackagePurchasePanelProps = {
  packageId: number;
  variables?: TebexPackageVariable[];
};

type BasketAuthState = {
  username: string;
  usernameId: number | null;
};

function DiscordIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 127.14 96.36" aria-hidden="true" className={className} fill="currentColor">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.74 56.6.54 80.2a105.73 105.73 0 0 0 32.17 16.16 77.7 77.7 0 0 0 6.89-11.28 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.35 2.66-2.08 20.87 9.56 43.58 9.56 64.21 0 .87.73 1.76 1.42 2.67 2.08a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.27 105.25 105.25 0 0 0 32.19-16.16c2.67-27.34-4.61-51.07-18.8-72.13ZM42.45 65.69c-6.27 0-11.42-5.73-11.42-12.8s5-12.8 11.42-12.8c6.46 0 11.52 5.76 11.42 12.8.01 7.07-5.04 12.8-11.42 12.8Zm42.24 0c-6.27 0-11.42-5.73-11.42-12.8s5-12.8 11.42-12.8c6.46 0 11.52 5.76 11.42 12.8 0 7.07-5.04 12.8-11.42 12.8Z" />
    </svg>
  );
}

function discordRequirementStorageKey(packageId: number) {
  return `tebex_package_requires_discord_${packageId}`;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBasket() {
  return ensureClientBasket();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PackagePurchasePanel({ packageId, variables = [] }: PackagePurchasePanelProps) {
  const searchParams = useSearchParams();
  const activeVariables = useMemo(() => variables.filter((v) => v.identifier || v.name), [variables]);
  const missingVariableDetail = searchParams.get("missingVariableDetail") || "";

  const [discordForcedByError, setDiscordForcedByError] = useState(() => {
    if (missingVariableDetail.toLowerCase().includes("discord")) return true;
    if (typeof window !== "undefined" && window.localStorage.getItem(discordRequirementStorageKey(packageId)) === "1") return true;
    return false;
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [discordUser, setDiscordUser] = useState<{ id: string; username: string; avatar: string | null } | null>(null);
  const [basketAuth, setBasketAuth] = useState<BasketAuthState>({ username: "", usernameId: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isBasketLoading, setIsBasketLoading] = useState(true);
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  // Derived state
  const requiresDiscord = useMemo(
    () => activeVariables.some((f) => `${f.name || ""} ${f.identifier || ""} ${f.description || ""}`.toLowerCase().includes("discord")),
    [activeVariables],
  );
  const discordRequired = requiresDiscord || discordForcedByError;
  const isTebexLoggedIn = Boolean(basketAuth.username || basketAuth.usernameId);

  const normalizedVariableData: Record<string, string> = {};
  for (const field of activeVariables) {
    const identifier = (field.identifier || field.name || "").trim();
    if (!identifier) continue;
    const value = (values[identifier] || "").trim();
    if (!value) continue;
    normalizedVariableData[identifier] = value;
    if (field.name && field.name !== identifier) normalizedVariableData[field.name] = value;
  }
  if (discordUser?.id) normalizedVariableData.discord_id = discordUser.id;

  const missingRequiredFields = activeVariables.some((field) => {
    if (!field.required) return false;
    const identifier = (field.identifier || field.name || "").trim();
    if (!identifier) return false;
    const keyMeta = `${field.name || ""} ${field.identifier || ""} ${field.description || ""}`.toLowerCase();
    if (keyMeta.includes("discord") && discordUser?.id) return false;
    return !(values[identifier] || "").trim();
  });

  const missingRequired = missingRequiredFields || (discordRequired && !discordUser?.id);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const key = discordRequirementStorageKey(packageId);
    if (typeof window !== "undefined" && window.localStorage.getItem(key) === "1") setDiscordForcedByError(true);
  }, [packageId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordState = params.get("discord");

    // If returning from Discord OAuth callback, capture data into sessionStorage
    if (discordState === "ok") {
      const id = params.get("discord_id") || "";
      const username = params.get("discord_username") || "";
      const avatar = params.get("discord_avatar") || null;
      if (id) {
        sessionStorage.setItem("discord_user", JSON.stringify({ id, username, avatar }));
        // Clean the URL params without reloading
        const clean = new URL(window.location.href);
        clean.searchParams.delete("discord");
        clean.searchParams.delete("discord_id");
        clean.searchParams.delete("discord_username");
        clean.searchParams.delete("discord_avatar");
        window.history.replaceState({}, "", clean.toString());
      }
    } else if (discordState) {
      toast.error(`Discord auth failed: ${discordState}`);
    }

    // Read Discord user from sessionStorage (ephemeral per tab)
    const stored = sessionStorage.getItem("discord_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string; username: string; avatar: string | null };
        if (parsed.id) setDiscordUser(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setIsBasketLoading(true);
      try {
        // Only check auth if a basket already exists — don't create one just to check.
        const storedIdent = getStoredBasketIdent();
        if (!storedIdent) {
          setBasketAuth({ username: "", usernameId: null });
          setShowLoginRequired(true);
          return;
        }
        const res = await fetch(`/api/tebex/basket?basketIdent=${encodeURIComponent(storedIdent)}`, { cache: "no-store" });
        if (!res.ok) { setBasketAuth({ username: "", usernameId: null }); setShowLoginRequired(true); return; }
        const payload = (await res.json()) as { data?: { username?: string | null; username_id?: number | null } };
        const username = payload.data?.username || "";
        const usernameId = payload.data?.username_id ?? null;
        setBasketAuth({ username, usernameId });
        setShowLoginRequired(!username && !usernameId);
      } catch {
        setBasketAuth({ username: "", usernameId: null });
        setShowLoginRequired(true);
      } finally {
        setIsBasketLoading(false);
      }
    };
    void run();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const startDiscordOAuth = () => {
    window.location.href = `/api/auth/discord/login?returnTo=${encodeURIComponent(window.location.href)}`;
  };

  const disconnectDiscord = () => {
    sessionStorage.removeItem("discord_user");
    setDiscordUser(null);
  };

  const startTebexLogin = async () => {
    try {
      setIsLoading(true);
      const basketIdent = await ensureBasket();
      const returnUrl = encodeURIComponent(`${window.location.origin}/packages/${packageId}`);
      const authRes = await fetch(`/api/tebex/basket/auth-url?basketIdent=${encodeURIComponent(basketIdent)}&returnUrl=${returnUrl}`);
      if (!authRes.ok) {
        const p = (await authRes.json().catch(() => ({ error: "Could not start Tebex login" }))) as { error?: string };
        throw new Error(p.error || "Could not start Tebex login");
      }
      const p = (await authRes.json()) as { url?: string; error?: string };
      if (!p.url) throw new Error(p.error || "Could not start Tebex login");
      window.location.href = p.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start Tebex login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      const basketIdent = await ensureBasket();
      const basketRes = await fetch(`/api/tebex/basket?basketIdent=${encodeURIComponent(basketIdent)}`, { cache: "no-store" });
      if (basketRes.ok) {
        const p = (await basketRes.json()) as { data?: { username?: string | null; username_id?: number | null } };
        const username = p.data?.username || "";
        const usernameId = p.data?.username_id ?? null;
        setBasketAuth({ username, usernameId });
        if (!username && !usernameId) { setShowLoginRequired(true); toast.error("Login required before adding this package."); return; }
      } else {
        setShowLoginRequired(true); toast.error("Login required before adding this package."); return;
      }
      let addRes = await fetch("/api/tebex/basket/items", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basketIdent, packageId, quantity: 1, variableData: normalizedVariableData }),
      });
      if (!addRes.ok && addRes.status >= 500) {
        await sleep(300);
        addRes = await fetch("/api/tebex/basket/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            basketIdent,
            packageId,
            quantity: 1,
            variableData: normalizedVariableData,
          }),
        });
      }
      if (!addRes.ok) {
        const p = (await addRes.json().catch(() => ({ error: "Could not add item" }))) as { error?: string; detail?: string };
        const message = (p.detail || p.error || "").toLowerCase();
        if (addRes.status === 422 && message.includes("must login")) { setShowLoginRequired(true); toast.error("Login required before adding this package."); return; }
        if (addRes.status === 400 && message.includes("please enter the")) {
          if (message.includes("discord")) {
            const key = discordRequirementStorageKey(packageId);
            if (typeof window !== "undefined") window.localStorage.setItem(key, "1");
            setDiscordForcedByError(true);
          }
          toast.error(p.detail || "This package requires additional fields.");
          return;
        }
        toast.error(p.detail || p.error || "Could not add item");
        return;
      }
      toast.success("Added to cart");
      if (discordUser?.id) {
        const key = discordRequirementStorageKey(packageId);
        if (typeof window !== "undefined") window.localStorage.setItem(key, "1");
      }
      window.dispatchEvent(new Event("cart-updated"));
      window.location.href = "/cart";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add item");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isBasketLoading) {
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying account…
        </div>
        <div className="h-2 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-2 w-1/2 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // ── Login required wall ────────────────────────────────────────────────────

  if (showLoginRequired && !isTebexLoggedIn) {
    return (
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Header band */}
        <div className="bg-muted/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <LogIn className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">Login required</p>
              <p className="text-xs text-muted-foreground">Sign in with Tebex to continue</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            You need a Tebex account to purchase this package. Login takes just a moment.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button className="flex-1 gap-2" onClick={startTebexLogin} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {isLoading ? "Connecting…" : "Login with Tebex"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main purchase panel ────────────────────────────────────────────────────

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">

      {/* Account status strip */}
      <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {basketAuth.username
            ? <><span className="font-medium text-foreground">{basketAuth.username}</span> · logged in via Tebex</>
            : basketAuth.usernameId
              ? <><span className="font-medium text-foreground">ID {basketAuth.usernameId}</span> · logged in via Tebex</>
              : "Not logged in"}
        </span>
      </div>

      <div className="space-y-5 p-5">

        {/* Variable fields */}
        {activeVariables.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">Package options</p>
            {activeVariables.map((field) => {
              const identifier = (field.identifier || field.name || "").trim();
              const label = field.name || field.identifier || "Variable";
              const isDiscordField = `${field.name || ""} ${field.identifier || ""} ${field.description || ""}`.toLowerCase().includes("discord");
              if (isDiscordField) return null; // handled separately below
              return (
                <div key={identifier} className="space-y-1.5">
                  <label htmlFor={`var-${identifier}`} className="flex items-center gap-1 text-sm font-medium">
                    {label}
                    {field.required && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    id={`var-${identifier}`}
                    value={values[identifier] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [identifier]: e.target.value }))}
                    placeholder={field.description || `Enter ${label}`}
                    required={Boolean(field.required)}
                    className="h-9"
                  />
                  {field.description && (
                    <p className="text-[11px] text-muted-foreground">{field.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Discord section */}
        {discordRequired && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Discord account</p>
              {discordUser && (
                <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                  <Check className="h-3 w-3" /> Connected
                </span>
              )}
            </div>

            {discordUser ? (
              <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  {discordUser.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=64`}
                      alt={discordUser.username}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5865F2]/20 text-[#5865F2]">
                      <DiscordIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{discordUser.username}</p>
                    <p className="text-[11px] text-muted-foreground">ID: {discordUser.id}</p>
                  </div>
                </div>
                <button
                  onClick={disconnectDiscord}
                  className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startDiscordOAuth}
                className="flex w-full items-center justify-between rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/5 px-4 py-3 text-sm font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2]/10 dark:border-[#5865F2]/20 dark:bg-[#5865F2]/10"
              >
                <span className="flex items-center gap-2.5">
                  <DiscordIcon className="h-4 w-4" />
                  Connect Discord account
                </span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>
            )}
          </div>
        )}

        {/* Validation message */}
        {missingRequired && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
            {discordRequired && !discordUser?.id
              ? "Connect your Discord account to continue."
              : "Fill in all required fields to continue."}
          </p>
        )}

        {/* CTA */}
        <Button
          type="button"
          className="w-full gap-2"
          size="lg"
          onClick={handleContinue}
          disabled={missingRequired || isLoading}
        >
          {isLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            : <><ShoppingCart className="h-4 w-4" /> Add to cart</>}
        </Button>
      </div>
    </div>
  );
}
