import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AiPerformanceBoard } from "@/components/AiPerformanceBoard";
import { getAiPerformanceEval } from "@/lib/ai/admin";

function canView(role: string) {
  return (
    hasPermission(role, "ai.admin") ||
    hasPermission(role, "ai.read") ||
    hasPermission(role, "skills.manage") ||
    hasPermission(role, "rag.manage")
  );
}

export default async function AiPerformancePage() {
  const user = await getCurrentUser();
  if (!user || !canView(user.role_code)) {
    redirect("/admin");
  }

  return (
    <div>
      <AdminPageHeader pageKey="ai-performance" />
      <div className="mb-4 text-sm">
        <Link className="underline" href="/admin/docs/tsd?lang=en">
          TSD §8A — AI performance evaluation
        </Link>
        {" · "}
        <Link className="underline" href="/admin/docs/tsd?lang=zh-Hant">
          TSD §8A — AI 績效評估
        </Link>
        {" · "}
        <Link className="underline" href="/admin/ai-admin">
          AI Admin
        </Link>
      </div>
      <AiPerformanceBoard
        initial={
          getAiPerformanceEval() as React.ComponentProps<typeof AiPerformanceBoard>["initial"]
        }
      />
    </div>
  );
}
