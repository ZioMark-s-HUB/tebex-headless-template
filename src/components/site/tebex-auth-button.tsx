"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";

import {
  clearPendingAddPayload,
  clearPendingPackageId,
  clearStoredBasketIdent,
  ensureClientBasket,
  getStoredBasketIdent,
} from "@/lib/client-basket";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function ensureBasket() {
  return ensureClientBasket();
}

export function TebexAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const run = async () => {
      const basketIdent = getStoredBasketIdent();
      if (!basketIdent) { setUsername(""); return; }
      const res = await fetch(`/api/tebex/basket?basketIdent=${encodeURIComponent(basketIdent)}`);
      if (!res.ok) { setUsername(""); return; }
      const payload = (await res.json()) as { data?: { username?: string | null } };
      setUsername(payload.data?.username || "");
    };
    void run();
  }, []);

  const onLogin = async () => {
    setIsLoading(true);
    try {
      const basketIdent = await ensureBasket();
      const returnUrl = encodeURIComponent(window.location.href);
      const authRes = await fetch(
        `/api/tebex/basket/auth-url?basketIdent=${encodeURIComponent(basketIdent)}&returnUrl=${returnUrl}`,
      );
      if (!authRes.ok) {
        const payload = (await authRes.json().catch(() => ({ error: "Could not build auth url" }))) as { error?: string };
        throw new Error(payload.error || "Could not build auth url");
      }
      const payload = (await authRes.json()) as { url: string };
      window.location.href = payload.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build auth url");
    } finally {
      setIsLoading(false);
    }
  };

  const onLogout = () => {
    clearPendingAddPayload();
    clearPendingPackageId();
    clearStoredBasketIdent();
    setUsername("");
    toast.success("Logged out");
    window.location.href = "/";
  };

  // ── Logged in ────────────────────────────────────────────────────────────
  if (username) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative gap-2 pr-3" aria-label={`Account: ${username}`}>
            {/* Avatar circle */}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {username.charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[96px] truncate sm:inline text-sm">{username}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-3 py-2">
            <p className="text-xs font-medium">{username}</p>
            <p className="text-[11px] text-muted-foreground">Tebex account</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ── Logged out ───────────────────────────────────────────────────────────
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onLogin}
      disabled={isLoading}
      className="gap-2"
      aria-label="Login with Tebex"
    >
      {isLoading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <LogIn className="h-4 w-4" />}
      <span className="hidden sm:inline">{isLoading ? "Connecting…" : "Login"}</span>
    </Button>
  );
}
