import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { ProgressTrackerBoard } from "@/components/ProgressTrackerBoard";
import { EnZh } from "@/components/EnZh";
import { readSearchParams } from "@/lib/static-export";

export default async function ProgressTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  await readSearchParams(searchParams);
  return (
    <div className="space-y-3">
      <div className="panel p-3 text-sm text-[var(--muted)]">
        <EnZh
          en="Timeline view of the same checklist as Open Issues. Query seed data: "
          zh="與開放議題同一清單的時間軸視圖。查詢種子資料："
        />
        <Link className="underline text-teal-800" href="/admin/docs/open-issues">
          <EnZh en="Open Issues" zh="開放議題" />
        </Link>
        {" · "}
        <Link className="underline text-teal-800" href="/admin/docs/simulated-data">
          <EnZh en="Simulated Data / SQL" zh="模擬資料／SQL" />
        </Link>
      </div>
      <ProgressTrackerBoard />
    </div>
  );
}
