"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalListing } from "@/lib/client-store";
import { StorefrontPreview } from "@/components/StorefrontPreview";
import type { SourcedProduct } from "@/lib/storefront-types";
import { tryApiJson } from "@/lib/try-api";

export function StorefrontDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<SourcedProduct | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const local = getLocalListing(id) ?? null;
    if (local) setProduct(local);
    tryApiJson<SourcedProduct>(`/api/storefront/${id}`).then((r) => {
      if (cancelled) return;
      if (r.ok) setProduct(r.data);
      else if (!local) setProduct(null);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (product === undefined) {
    return <p className="panel mt-10 p-8 text-mist">Loading listing…</p>;
  }
  if (!product) {
    return (
      <div>
        <Link href="/storefront" className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
          ← Sourced catalog
        </Link>
        <p className="panel mt-8 p-8 text-mist">
          No sourced listing for <span className="text-paper">{id}</span> yet. Generate it from the
          radar or today&apos;s queue — it will appear here.
        </p>
        <Link href={`/products/${id}`} className="mt-4 inline-block text-rust">
          Open radar card
        </Link>
      </div>
    );
  }

  return (
    <article>
      <Link href="/storefront" className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
        ← Sourced catalog
      </Link>
      <div className="mt-6">
        <StorefrontPreview product={product} />
      </div>
    </article>
  );
}
