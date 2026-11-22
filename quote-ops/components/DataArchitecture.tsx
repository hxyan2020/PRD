"use client";

import { ACCESS_PLACEHOLDERS, DB_SYSTEMS } from "@/lib/data/databases";
import { useI18n } from "@/lib/i18n/context";

export function DataArchitecture() {
  const { locale, t } = useI18n();

  return (
    <div className="space-y-6 animate-rise">
      <header>
        <h1 className="font-display text-3xl text-ink">
          {t("数据库架构与访问地址", "Database architecture & access")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mist">
          {locale === "zh-CN" ? ACCESS_PLACEHOLDERS.noteZh : ACCESS_PLACEHOLDERS.note}
        </p>
      </header>

      <div className="grid gap-3 rounded-xl border border-copper/30 bg-copper-soft/40 p-4 sm:grid-cols-2">
        {[
          ["VPN", ACCESS_PLACEHOLDERS.vpn],
          ["Bastion", ACCESS_PLACEHOLDERS.bastion],
          ["BI", ACCESS_PLACEHOLDERS.bi],
          ["Grafana", ACCESS_PLACEHOLDERS.grafana],
          ["Runbook", ACCESS_PLACEHOLDERS.runbookWiki],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-[11px] uppercase tracking-wide text-copper">{k}</div>
            <code className="break-all font-mono text-xs text-ink-2">{v}</code>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {DB_SYSTEMS.map((db) => (
          <article
            key={db.id}
            id={db.id}
            className="scroll-mt-24 rounded-2xl border border-line bg-white/85 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-ink">
                  {locale === "zh-CN" ? db.nameZh : db.name}
                </h2>
                <p className="mt-1 text-sm text-mist">
                  {locale === "zh-CN" ? db.purposeZh : db.purpose}
                </p>
              </div>
              <span className="rounded border border-line bg-paper px-2 py-1 font-mono text-[11px] text-mist">
                {db.engine}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Meta label={t("Host", "Host")} value={db.hostPlaceholder} />
              <Meta label={t("Port", "Port")} value={db.portPlaceholder} />
              <Meta label="Owner" value={db.owner} />
            </div>

            <p className="mt-3 text-sm text-ink-2">
              {locale === "zh-CN" ? db.schemaNotesZh : db.schemaNotes}
            </p>

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-mist">
              {t("关键表", "Key tables")}
            </h3>
            <ul className="mt-2 space-y-2">
              {db.keyTables.map((tb) => (
                <li key={tb.name} className="rounded-lg border border-line/70 bg-paper/60 px-3 py-2">
                  <code className="font-mono text-xs text-sea">{tb.name}</code>
                  <p className="mt-1 text-xs text-mist">
                    {locale === "zh-CN" ? tb.descriptionZh : tb.description}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {db.accessRoles.map((role) => (
                <span
                  key={role}
                  className="rounded border border-line bg-white px-2 py-0.5 text-[11px] text-mist"
                >
                  {role}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-mist">{label}</div>
      <code className="break-all font-mono text-xs text-ink-2">{value}</code>
    </div>
  );
}
