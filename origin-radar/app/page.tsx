import { categories, getProducts } from "@/lib/catalog";
import { ProductExplorer } from "@/components/ProductExplorer";
import { RadarHero } from "@/components/RadarHero";

export default function HomePage() {
  const products = getProducts();
  return (
    <>
      <RadarHero />
      <ProductExplorer products={products} categories={categories()} />
    </>
  );
}
