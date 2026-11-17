import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { ProgressTrackerBoard } from "@/components/ProgressTrackerBoard";
import { readSearchParams } from "@/lib/static-export";

export default async function ProgressTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  await readSearchParams(searchParams);
  return <ProgressTrackerBoard />;
}
