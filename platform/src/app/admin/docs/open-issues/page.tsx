import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { OpenIssuesBoard } from "@/components/OpenIssuesBoard";
import { EnZh } from "@/components/EnZh";
import { readSearchParams } from "@/lib/static-export";

export default async function OpenIssuesPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  await readSearchParams(searchParams);
  return (
    <div className="space-y-3">
      <div className="panel p-3 text-sm text-[var(--muted)]">
        <EnZh
          en="Same issue set as Progress Tracker (timeline view). Seed tables for these demos: "
          zh="與進度追蹤共用同一議題集（時間軸視圖）。這些示範的種子資料表："
        />
        <Link className="underline text-teal-800" href="/admin/docs/progress">
          <EnZh en="Progress Tracker" zh="進度追蹤" />
        </Link>
        {" · "}
        <Link className="underline text-teal-800" href="/admin/docs/simulated-data">
          <EnZh en="Simulated Data / SQL" zh="模擬資料／SQL" />
        </Link>
      </div>
      <OpenIssuesBoard />
    </div>
  );
}
