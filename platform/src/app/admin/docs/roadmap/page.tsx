import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { DocArticlePage } from "@/components/DocArticlePage";
import { readSearchParams } from "@/lib/static-export";

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await readSearchParams(searchParams);
  return <DocArticlePage docId="ROADMAP" langParam={sp.lang} />;
}
