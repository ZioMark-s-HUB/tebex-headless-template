import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Shield, Tag, Zap } from "lucide-react";

import { getPackageById } from "@/lib/tebex-server";
import { PackagePurchasePanel } from "@/components/site/package-purchase-panel";
import { PackageImageGallery } from "@/components/site/package-image-gallery";
import { TebexImage } from "@/types/tebex";

type PackagePageProps = {
  params: Promise<{ id: string }>;
};

function sanitizePackageHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

function resolveImageUrl(img: TebexImage | string | null | undefined): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.url ?? img.image ?? img.src ?? "";
}

function collectImages(item: {
  image?: TebexImage | string | null;
  images?: Array<TebexImage | string> | null;
  gallery?: Array<TebexImage | string> | null;
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const add = (url: string) => {
    if (url && !seen.has(url)) { seen.add(url); urls.push(url); }
  };

  // Featured image first
  add(resolveImageUrl(item.image));

  // Additional images from images/gallery arrays
  for (const img of item.images ?? []) add(resolveImageUrl(img));
  for (const img of item.gallery ?? []) add(resolveImageUrl(img));

  return urls;
}

export default async function PackagePage({ params }: PackagePageProps) {
  const { id } = await params;
  const packageId = Number(id);
  if (!Number.isFinite(packageId)) notFound();

  let item;
  try {
    item = await getPackageById(packageId);
  } catch {
    notFound();
  }

  const images = collectImages(item);
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.currency || "EUR",
  }).format(item.total_price);

  return (
    <>
      <style>{`
        @keyframes pkg-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pkg-a1 { animation: pkg-fade 0.22s ease-out both; }
        .pkg-a2 { animation: pkg-fade 0.22s ease-out 0.06s both; }
        .pkg-a3 { animation: pkg-fade 0.22s ease-out 0.12s both; }
      `}</style>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="pkg-a1 mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Store</Link>
          {item.category?.name && (
            <>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <Link
                href={`/category/${item.category.id ?? ""}`}
                className="transition-colors hover:text-foreground"
              >
                {item.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium text-foreground">{item.name}</span>
        </nav>

        {/* ── Main 2-col: image left, details + purchase right ── */}
        <div className="pkg-a2 grid items-start gap-8 lg:grid-cols-[1fr_380px]">

          {/* LEFT — image gallery */}
          <PackageImageGallery images={images} name={item.name} />

          {/* RIGHT — product info + purchase (sticky) */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Info card */}
            <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
              {/* Category pill */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Tag className="h-2.5 w-2.5" />
                {item.category?.name ?? "General"}
              </span>

              {/* Name */}
              <h1 className="text-xl font-bold leading-snug tracking-tight">{item.name}</h1>

              {/* Price */}
              <p className="text-2xl font-bold tabular-nums text-primary">{price}</p>
            </div>

            {/* Purchase panel */}
            <PackagePurchasePanel packageId={item.id} variables={item.variables} />
          </div>
        </div>

        {/* ── Description — full width below ── */}
        <div className="pkg-a3 mt-8 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </h2>
          <div
            className="prose prose-sm max-w-none break-words overflow-hidden dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg"
            dangerouslySetInnerHTML={{
              __html: sanitizePackageHtml(item.description || "<p>No description provided.</p>"),
            }}
          />
        </div>
      </div>
    </>
  );
}
