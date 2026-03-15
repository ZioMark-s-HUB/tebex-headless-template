import { Suspense } from "react";

import { CartClient } from "@/components/site/cart-client";

export default function CartPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading cart...</div>}>
        <CartClient />
      </Suspense>
    </div>
  );
}
