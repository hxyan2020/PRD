import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SimulatedDataBoard } from "@/components/SimulatedDataBoard";
import { T } from "@/components/T";
import { EnZh } from "@/components/EnZh";

export default async function SimulatedDataPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  return (
    <div>
      <AdminPageHeader
        pageKey="simulated-data"
        actions={
          <Link className="btn" href="/admin/docs/urls">
            <T k="urls.data" />
          </Link>
        }
      />
      <p className="text-sm text-[var(--muted)] mb-4">
        <EnZh
          en="All demo tables seeded into vantage_risk.db — inspect schemas, browse rows, and run your own read-only SQL."
          zh="寫入 vantage_risk.db 的全部示範資料表 — 可檢視結構、瀏覽列資料，並自行執行唯讀 SQL。"
        />
      </p>
      <SimulatedDataBoard />
    </div>
  );
}
