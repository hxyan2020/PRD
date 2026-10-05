"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { Phrase } from "@/components/Phrase";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t } from "@/lib/i18n";
import {
  canRollbackAudit,
  parseAuditDetails,
  planeOfAudit,
  rollbackUnavailableReason,
  type AuditLogRow,
  type AuditPlane,
} from "@/lib/audit";

export function AuditBoard({ logs }: { logs: AuditLogRow[] }) {
  const { locale } = useUiLocale();
  const router = useRouter();
  const [tab, setTab] = useState<AuditPlane>("crmp");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const partitioned = useMemo(() => {
    const crmp: AuditLogRow[] = [];
    const vantage: AuditLogRow[] = [];
    for (const row of logs) {
      if (planeOfAudit(row) === "vantage") vantage.push(row);
      else crmp.push(row);
    }
    return { crmp, vantage };
  }, [logs]);

  const visible = tab === "crmp" ? partitioned.crmp : partitioned.vantage;

  async function onRollback(row: AuditLogRow) {
    const details = parseAuditDetails(row.details_json);
    if (!canRollbackAudit(row.action, details)) return;
    const confirmMsg =
      locale === "zh-Hant"
        ? `確定回滾稽核 #${row.id}（${row.action}）？將還原變更前快照。`
        : `Roll back audit #${row.id} (${row.action})? This restores the before-state snapshot.`;
    if (!window.confirm(confirmMsg)) return;
    setBusyId(row.id);
    setMessage(null);
    try {
      const res = await fetch("/api/audit/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit_id: row.id }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(data.error || t("audit.rollbackFailed", locale));
        return;
      }
      setMessage(t("audit.rollbackOk", locale));
      startTransition(() => router.refresh());
    } catch (e) {
      setMessage((e as Error).message || t("audit.rollbackFailed", locale));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="panel p-4 space-y-3">
        <p className="text-sm text-[var(--muted)] max-w-3xl">{t("audit.boardIntro", locale)}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn ${tab === "crmp" ? "btn-primary" : ""}`}
            onClick={() => setTab("crmp")}
            data-testid="audit-tab-crmp"
          >
            {t("audit.tabCrmp", locale)} ({partitioned.crmp.length})
          </button>
          <button
            type="button"
            className={`btn ${tab === "vantage" ? "btn-primary" : ""}`}
            onClick={() => setTab("vantage")}
            data-testid="audit-tab-vantage"
          >
            {t("audit.tabVantage", locale)} ({partitioned.vantage.length})
          </button>
        </div>
        {message ? <p className="text-sm text-teal-900">{message}</p> : null}
      </div>

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t("common.when", locale)}</th>
              <th>{t("common.actor", locale)}</th>
              <th>{t("common.actions", locale)}</th>
              <th>{t("common.entity", locale)}</th>
              <th>{t("common.details", locale)}</th>
              <th>{t("audit.rollback", locale)}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-sm text-[var(--muted)]">
                  {t("audit.empty", locale)}
                </td>
              </tr>
            ) : (
              visible.map((l) => {
                const details = parseAuditDetails(l.details_json);
                const can = canRollbackAudit(l.action, details);
                const tip = can ? undefined : rollbackUnavailableReason(l.action, details, locale);
                const displayDetails = { ...details };
                delete displayDetails.plane;
                return (
                  <tr key={l.id} data-testid={`audit-row-${l.id}`}>
                    <td className="text-sm whitespace-nowrap">{l.created_at}</td>
                    <td>{l.actor_name ?? t("common.system", locale)}</td>
                    <td>
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">
                        <Phrase>{l.action}</Phrase>
                      </Badge>
                    </td>
                    <td className="text-sm">
                      <Phrase>{l.entity_type}</Phrase>
                      {l.entity_id ? ` / ${l.entity_id}` : ""}
                    </td>
                    <td className="text-xs break-all max-w-xl text-[var(--muted)]">
                      {JSON.stringify(displayDetails)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn text-xs"
                        disabled={!can || busyId === l.id || pending}
                        title={tip}
                        onClick={() => onRollback(l)}
                        data-testid={`audit-rollback-${l.id}`}
                      >
                        {busyId === l.id ? t("common.working", locale) : t("audit.rollback", locale)}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
