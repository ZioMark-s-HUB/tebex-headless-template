"use client";

import Image from "next/image";
import { useState } from "react";

type PackageImageGalleryProps = {
  images: string[];
  name: string;
};

function PackageImageFallback({ name }: { name: string }) {
  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex h-full w-full items-center justify-center text-5xl font-bold text-white/60 select-none"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 50% 30%), hsl(${(hue + 50) % 360} 55% 20%))`,
      }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function PackageImageGallery({ images, name }: PackageImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const hasImages = images.length > 0;
  const currentImage = images[selected] || "";
  const showThumbnails = images.length > 1;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
        {hasImages ? (
          <Image
            key={currentImage}
            src={currentImage}
            alt={`${name}${images.length > 1 ? ` — image ${selected + 1}` : ""}`}
            fill
            priority={selected === 0}
            className="object-contain p-2 transition-opacity duration-200"
            sizes="(max-width: 1024px) 100vw, 560px"
          />
        ) : (
          <PackageImageFallback name={name} />
        )}
      </div>

      {/* Thumbnail strip */}
      {showThumbnails && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-all ${
                i === selected
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
