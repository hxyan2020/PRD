import { CategoriesView } from "@/components/CategoriesView";
import { listCategories } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await ensureSeeded();
  const categories = await listCategories();
  return <CategoriesView categories={categories} />;
}
