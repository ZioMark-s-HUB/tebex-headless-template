"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LifeBuoy, Menu, ShoppingBag, X } from "lucide-react";

type Category = { id: number; name: string };

function MobileDrawer({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return createPortal(
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed inset-y-0 left-0 z-[9999] flex w-72 flex-col bg-background shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="text-sm font-semibold tracking-tight">Menu</span>
          <button
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            Home
          </Link>

          {categories.length > 0 && (
            <div className="pt-3">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Categories
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/support"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <LifeBuoy className="h-4 w-4 text-muted-foreground" />
            Support
          </Link>
        </nav>
      </div>
    </>,
    document.body,
  );
}

export function MobileMenuButton({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <button
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted && (
        <MobileDrawer open={open} onClose={() => setOpen(false)} categories={categories} />
      )}
    </>
  );
}
