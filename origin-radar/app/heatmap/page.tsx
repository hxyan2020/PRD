import { getProducts } from "@/lib/catalog";
import { HeatmapGrid } from "@/components/HeatmapGrid";

export default function HeatmapPage() {
  return <HeatmapGrid products={getProducts()} />;
}
