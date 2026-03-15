import { tebexConfig } from "@/lib/env";
import { TebexBasket, TebexCategory, TebexListingsResponse, TebexPackage } from "@/types/tebex";

const TEBEX_HEADLESS_BASE = "https://headless.tebex.io/api";

export class TebexRequestError extends Error {
  status: number;
  responseBody?: string;

  constructor(message: string, status: number, responseBody?: string) {
    super(message);
    this.name = "TebexRequestError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const auth = Buffer.from(
    `${tebexConfig.publicToken}:${tebexConfig.privateKey}`,
  ).toString("base64");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
    ...extra,
  };
}

export function getTebexAuthHeader() {
  const auth = Buffer.from(
    `${tebexConfig.publicToken}:${tebexConfig.privateKey}`,
  ).toString("base64");
  return `Basic ${auth}`;
}

export async function getListings() {
  if (
    !tebexConfig.webstoreIdentifier ||
    !tebexConfig.publicToken ||
    !tebexConfig.privateKey
  ) {
    return null;
  }

  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/categories?includePackages=1`,
    { headers: buildHeaders(), next: { revalidate: 60 } },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch Tebex listings (${res.status}): ${body}`);
  }

  const raw = (await res.json()) as unknown;
  return normalizeListingsResponse(raw);
}

export async function createBasket(username?: string) {
  const doCreate = () =>
    fetch(
      `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/baskets`,
      {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          complete_url: `${tebexConfig.siteUrl}/cart?state=complete`,
          cancel_url: `${tebexConfig.siteUrl}/cart?state=cancelled`,
          ...(username ? { username } : {}),
        }),
      },
    );

  let res = await doCreate();
  if (!res.ok && res.status >= 500) {
    await new Promise((r) => setTimeout(r, 350));
    res = await doCreate();
  }

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to create basket (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return (await res.json()) as { data: TebexBasket };
}

export async function getBasket(basketIdent: string) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/baskets/${basketIdent}`,
    {
      headers: buildHeaders(),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to fetch basket (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return (await res.json()) as { data: TebexBasket };
}

export async function addPackageToBasket(
  basketIdent: string,
  packageId: number,
  quantity = 1,
  variableData?: Record<string, string>,
) {
  const payload: Record<string, unknown> = { package_id: packageId, quantity };
  if (variableData && Object.keys(variableData).length > 0) {
    payload.variable_data = variableData;
  }

  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/baskets/${basketIdent}/packages`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to add package to basket (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return getBasket(basketIdent);
}

export async function removePackageFromBasket(
  basketIdent: string,
  packageId: number,
) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/baskets/${basketIdent}/packages/remove`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ package_id: packageId }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to remove package from basket (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return getBasket(basketIdent);
}

export async function updateBasketPackageQuantity(
  basketIdent: string,
  packageId: number,
  quantity: number,
) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/baskets/${basketIdent}/packages/${packageId}`,
    {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({ quantity }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to update package quantity (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return getBasket(basketIdent);
}

export async function getPackageById(packageId: number) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/packages/${packageId}`,
    { headers: buildHeaders(), next: { revalidate: 60 } },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to fetch package (${res.status}): ${body}`,
      res.status,
    );
  }

  const payload = (await res.json()) as { data?: TebexPackage | TebexPackage[] };
  const data = payload.data;

  if (Array.isArray(data)) {
    if (!data.length) {
      throw new TebexRequestError("Package not found", 404);
    }
    return data[0];
  }

  if (!data) {
    throw new TebexRequestError("Package not found", 404);
  }

  return data;
}

export async function getCategoryById(categoryId: number) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/categories/${categoryId}?includePackages=1`,
    { headers: buildHeaders(), next: { revalidate: 60 } },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to fetch category (${res.status}): ${body}`,
      res.status,
    );
  }

  const payload = (await res.json()) as { data?: TebexCategory | TebexCategory[] };
  const data = payload.data;
  if (Array.isArray(data)) {
    if (!data.length) {
      throw new TebexRequestError("Category not found", 404);
    }
    return data[0];
  }
  if (!data) {
    throw new TebexRequestError("Category not found", 404);
  }
  return data;
}

export async function applyDiscountCode(basketIdent: string, code: string) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/baskets/${basketIdent}/coupons`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ coupon_code: code }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to apply discount code (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return getBasket(basketIdent);
}

export async function applyCreatorCode(basketIdent: string, code: string) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/baskets/${basketIdent}/creator-codes`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ creator_code: code }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to apply creator code (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return getBasket(basketIdent);
}

export async function removeDiscountCode(basketIdent: string, code?: string) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/baskets/${basketIdent}/coupons/remove`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(code ? { coupon_code: code } : {}),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to remove discount code (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return getBasket(basketIdent);
}

export async function removeCreatorCode(basketIdent: string) {
  const res = await fetch(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/baskets/${basketIdent}/creator-codes/remove`,
    {
      method: "POST",
      headers: buildHeaders(),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new TebexRequestError(
      `Failed to remove creator code (${res.status}): ${body}`,
      res.status,
      body,
    );
  }

  return getBasket(basketIdent);
}

export function buildAuthUrl(basketIdent: string, returnUrl: string) {
  const target = new URL(
    `${TEBEX_HEADLESS_BASE}/accounts/${tebexConfig.webstoreIdentifier}/baskets/${basketIdent}/auth`,
  );
  target.searchParams.set("returnUrl", returnUrl);
  return target.toString();
}

function normalizeListingsResponse(raw: unknown): TebexListingsResponse {
  const root = raw as
    | { data?: TebexCategory[] | { categories?: TebexCategory[]; packages?: TebexPackage[] } }
    | TebexCategory[]
    | undefined;

  let categories: TebexCategory[] = [];
  if (Array.isArray(root)) {
    categories = root;
  } else if (Array.isArray(root?.data)) {
    categories = root.data;
  } else if (Array.isArray(root?.data?.categories)) {
    categories = root.data.categories;
  }

  const packages =
    categories.flatMap((category) =>
      (category.packages ?? []).map((pkg) => ({
        ...pkg,
        category: pkg.category ?? {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
      })),
    ) ?? [];

  return {
    data: {
      categories,
      packages,
    },
  };
}
