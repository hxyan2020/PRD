import { getProducts } from "@/lib/catalog";
import { StorefrontDetail } from "@/components/StorefrontDetail";

export function generateStaticParams() {
  return getProducts().map((p) => ({ id: p.slug }));
}

export default async function StorefrontProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StorefrontDetail id={id} />;
}
