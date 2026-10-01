import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listSpineEvents, spineStageCounts } from "@/lib/ai/spine";
import { Badge, SeverityBadge, StatCard } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";

const STAGE_ORDER = ["DETECT", "ALARM", "AI_RCA", "SKILL_EXECUTE", "HUMAN_INTERVENTION", "RESOLVED", "DASHBOARD"];

export default async function SpinePage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "spine.read")) redirect("/admin");

  const db = getDb();
  const events = listSpineEvents(db, 150) as Array<{
    id: number;
    event_id: string;
    stage: string;
    product: string | null;
    ref_type: string | null;
    ref_id: string | null;
    severity: string | null;
    title: string;
    detail_json: string;
    actor: string | null;
    created_at: string;
  }>;
  const counts = Object.fromEntries(spineStageCounts(db, 24).map((c) => [c.stage, c.c]));

  return (
    <div>
      <AdminPageHeader pageKey="spine" />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {STAGE_ORDER.map((s) => (
          <StatCard key={s} label={`${s} (24h)`} value={counts[s] ?? 0} />
        ))}
      </div>

      <div className="panel mb-4 p-4">
        <div className="flex flex-wrap gap-2 items-center text-sm">
          {STAGE_ORDER.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-2">
              <Badge className="bg-teal-50 text-teal-900 border-teal-200">{s}</Badge>
              {i < STAGE_ORDER.length - 1 ? <span className="text-[var(--muted)]">→</span> : null}
            </span>
          ))}
        </div>
      </div>

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>Stage</th>
              <th>Title</th>
              <th>Product</th>
              <th>Severity</th>
              <th>Actor</th>
              <th>Ref</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="text-sm whitespace-nowrap">{e.created_at}</td>
                <td>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">{e.stage}</Badge>
                </td>
                <td>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-[var(--muted)]">{e.event_id}</div>
                </td>
                <td>{e.product ?? "—"}</td>
                <td>{e.severity ? <SeverityBadge value={e.severity} /> : "—"}</td>
                <td className="text-sm">{e.actor}</td>
                <td className="text-xs">
                  {e.ref_type}/{e.ref_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
