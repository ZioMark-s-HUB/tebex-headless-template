const KEY = "tebex_basket_ident";
const PENDING_PACKAGE_KEY = "tebex_pending_package_id";
const PENDING_ADD_KEY = "tebex_pending_add_payload";
let createBasketInFlight: Promise<string> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getStoredBasketIdent() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(KEY) ?? "";
}

export function setStoredBasketIdent(value: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(KEY, value);
}

export function clearStoredBasketIdent() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(KEY);
}

export function setPendingPackageId(packageId: number) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PENDING_PACKAGE_KEY, String(packageId));
}

export function getPendingPackageId() {
  if (typeof window === "undefined") {
    return 0;
  }
  const value = window.localStorage.getItem(PENDING_PACKAGE_KEY);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clearPendingPackageId() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(PENDING_PACKAGE_KEY);
}

export function setPendingAddPayload(payload: {
  packageId: number;
  variableData?: Record<string, string>;
}) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PENDING_ADD_KEY, JSON.stringify(payload));
}

export function getPendingAddPayload() {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(PENDING_ADD_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      packageId?: number;
      variableData?: Record<string, string>;
    };
    if (!parsed.packageId || !Number.isFinite(parsed.packageId)) {
      return null;
    }
    return {
      packageId: Number(parsed.packageId),
      variableData: parsed.variableData || {},
    };
  } catch {
    return null;
  }
}

export function clearPendingAddPayload() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(PENDING_ADD_KEY);
}

export async function ensureClientBasket() {
  const current = getStoredBasketIdent();
  if (current) return current;

  if (createBasketInFlight) {
    return createBasketInFlight;
  }

  createBasketInFlight = (async () => {
    let lastError = "Could not create basket";
    const delays = [0, 300, 650];

    for (let attempt = 0; attempt < delays.length; attempt += 1) {
      if (delays[attempt] > 0) {
        await sleep(delays[attempt]);
      }

      const res = await fetch("/api/tebex/basket", { method: "POST" });
      const payload = (await res.json().catch(() => ({}))) as {
        data?: { ident?: string };
        error?: string;
        detail?: string;
      };

      if (res.ok) {
        const ident = payload.data?.ident?.trim() ?? "";
        if (ident) {
          setStoredBasketIdent(ident);
          return ident;
        }
        lastError = "Could not create basket";
        continue;
      }

      lastError = payload.detail || payload.error || "Could not create basket";
      if (res.status < 500) {
        throw new Error(lastError);
      }
    }

    throw new Error(lastError);
  })();

  try {
    return await createBasketInFlight;
  } finally {
    createBasketInFlight = null;
  }
}
