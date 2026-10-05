"use client";

import Link from "next/link";
import { Badge, SeverityBadge } from "@/components/ui";
import type { AiBlockItem } from "@/lib/security/ai-access-blocklist";
import { useT } from "@/hooks/useUiLocale";

/**
 * Explicit list (under RAG) of admin pages/functions AI cannot edit —
 * must escalate to a human with the listed authorization.
 */
export function RagAiHumanGatePanel({ items }: { items: AiBlockItem[] }) {
  const { t, phrase } = useT();
  const pages = items.filter((i) => i.category === "PAGE");
  const functions = items.filter((i) => i.category === "FUNCTION");

  return (
    <div className="panel p-4 border-rose-200 bg-rose-50/30 space-y-4" data-testid="rag-ai-human-gate">
      <div>
        <div className="text-xs uppercase tracking-[0.12em] text-rose-900">{t("rag.humanGateTitle")}</div>
        <p className="text-sm mt-1 text-rose-950 max-w-4xl">{t("rag.humanGateBody")}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge className="bg-rose-100 text-rose-950 border-rose-300">{t("rag.humanGateEscalate")}</Badge>
          <Badge className="bg-amber-50 text-amber-950 border-amber-200">PAGE-RAG · PROPOSE_ONLY</Badge>
          <Badge className="bg-amber-50 text-amber-950 border-amber-200">FN-RAG-WRITE · FORBIDDEN</Badge>
          <Link className="underline text-rose-950" href="/admin/security/ai-access">
            {t("rag.securityLink")}
          </Link>
          <Link className="underline text-rose-950" href="/admin/ai-admin">
            {t("rag.aiAdminLink")}
          </Link>
        </div>
      </div>

      <Section title={t("rag.humanGatePages")} count={pages.length}>
        <BlockTable items={pages} phrase={phrase} t={t} />
      </Section>

      <Section title={t("rag.humanGateFunctions")} count={functions.length}>
        <BlockTable items={functions} phrase={phrase} t={t} />
      </Section>

      <p className="text-[11px] text-rose-900/80">{t("rag.humanGateFooter")}</p>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs text-[var(--muted)]">{count}</span>
      </div>
      {children}
    </div>
  );
}

function BlockTable({
  items,
  phrase,
  t,
}: {
  items: AiBlockItem[];
  phrase: (s: string) => string;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  if (!items.length) return null;
  return (
    <div className="table-wrap rounded-xl border border-rose-200 bg-white/90">
      <table className="data text-sm">
        <thead>
          <tr>
            <th>{t("rag.colId")}</th>
            <th>{t("rag.colTarget")}</th>
            <th>{t("common.severity")}</th>
            <th>{t("rag.colAiMay")}</th>
            <th>{t("rag.colEscalateTo")}</th>
            <th>{t("rag.colPerms")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} data-testid={`rag-block-${i.id}`}>
              <td className="align-top">
                <div className="font-mono text-[11px]">{i.id}</div>
                <div className="font-semibold mt-0.5">{phrase(i.name)}</div>
                <p className="text-[11px] text-[var(--muted)] mt-1 max-w-[16rem] leading-snug">
                  {phrase(i.reason)}
                </p>
              </td>
              <td className="align-top font-mono text-[11px] break-all max-w-[14rem]">{i.target}</td>
              <td className="align-top">
                <SeverityBadge value={i.severity} />
              </td>
              <td className="align-top">
                <Badge
                  className={
                    i.ai_may === "FORBIDDEN" || i.ai_may === "NONE"
                      ? "bg-rose-50 text-rose-900 border-rose-200"
                      : "bg-amber-50 text-amber-950 border-amber-200"
                  }
                >
                  {i.ai_may}
                </Badge>
              </td>
              <td className="align-top text-xs">
                <ul className="space-y-0.5">
                  {i.human_roles.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </td>
              <td className="align-top font-mono text-[11px]">
                <ul className="space-y-0.5">
                  {i.required_permissions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
