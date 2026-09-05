import Link from "next/link";
import { notFound } from "next/navigation";
import { getSourced } from "@/lib/db";
import { StorefrontPreview } from "@/components/StorefrontPreview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function StorefrontProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getSourced(id);
  if (!product) notFound();
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
