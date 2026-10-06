"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Brain,
  GitBranch,
  MessageSquare,
  Radio,
  Settings,
  Shield,
  Sparkles,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { isPublicSnapshot } from "@/lib/static-export";
import { useUiLocale } from "@/hooks/useUiLocale";
import { phrase } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Setting = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

type GroupDef = {
  id: string;
  titleEn: string;
  titleZh: string;
  blurbEn: string;
  blurbZh: string;
  icon: LucideIcon;
  keys: string[];
};

/** Operator workflow: identity → detect → AI → respond. */
const GROUPS: GroupDef[] = [
  {
    id: "identity",
    titleEn: "Platform identity",
    titleZh: "平台身分",
    blurbEn: "Desk name, products in scope, and the named docs / platform owner.",
    blurbZh: "後台名稱、涵蓋產品，以及具名文件／平台負責人。",
    icon: Settings,
    keys: [
      "platform.name",
      "platform.owner_name",
      "platform.owner_email",
      "platform.docs_owner",
      "products.coverage",
    ],
  },
  {
    id: "monitor",
    titleEn: "Monitor & detection",
    titleZh: "監控與偵測",
    blurbEn: "Monitor 2.0 sync and whether detectors may raise alarms.",
    blurbZh: "Monitor 2.0 同步，以及偵測器是否可發出警報。",
    icon: Activity,
    keys: ["monitor2.sync_enabled", "monitor2.base_url", "detectors.auto_raise_alarms"],
  },
  {
    id: "ai",
    titleEn: "AI analysis",
    titleZh: "AI 分析",
    blurbEn: "When RCA runs, confidence gates, second opinion, and RAG depth.",
    blurbZh: "何時跑根因分析、信心門檻、第二意見與 RAG 深度。",
    icon: Brain,
    keys: [
      "ai.rca_enabled",
      "ai.auto_on_alarm",
      "ai.min_confidence",
      "ai.second_opinion_severity",
      "ai.rag_top_k",
    ],
  },
  {
    id: "control",
    titleEn: "Skills & dual control",
    titleZh: "技能與雙人核准",
    blurbEn: "Auto-execute playbooks only when certain, and require maker ≠ checker.",
    blurbZh: "僅在確定時自動執行技能，並要求 Maker ≠ Checker。",
    icon: Shield,
    keys: ["ai.skill_certainty_only", "ai.maker_checker_required"],
  },
  {
    id: "intel",
    titleEn: "Market intelligence",
    titleZh: "市場情報",
    blurbEn: "5-minute scan cadence, dedicated channel, and indicator alarms.",
    blurbZh: "五分鐘掃描節奏、專用頻道，以及指標警報。",
    icon: Radio,
    keys: [
      "market_intel.enabled",
      "market_intel.interval_minutes",
      "market_intel.lark_chat_id",
      "market_intel.raise_indicator_alarms",
    ],
  },
  {
    id: "messenger",
    titleEn: "Messenger / Lark",
    titleZh: "Messenger／Lark",
    blurbEn: "Prototype Lark app and whether notifications are on.",
    blurbZh: "示範用 Lark 應用與是否發送通知。",
    icon: MessageSquare,
    keys: ["lark.enabled", "lark.app_id"],
  },
  {
    id: "escalation",
    titleEn: "Escalation & SLA",
    titleZh: "升級與 SLA",
    blurbEn: "Fallback SLA when a route does not define one.",
    blurbZh: "路線未定義時的預設 SLA。",
    icon: GitBranch,
    keys: ["escalation.default_sla_minutes"],
  },
  {
    id: "cs",
    titleEn: "CS / TR operations",
    titleZh: "CS／TR 營運",
    blurbEn: "Follow-up cap, wait / TR / Risk SLAs, intake token, named mailboxes, Lark chats, AI auto-reply max severity.",
    blurbZh: "追問上限、等待／TR／風控 SLA、進件 token、具名信箱、Lark 頻道、AI 直回最高嚴重度。",
    icon: Headphones,
    keys: [
      "cs.followup_cap",
      "cs.wait_sla_minutes",
      "cs.id_verify_sla_minutes",
      "cs.tr_sla_minutes",
      "cs.risk_sla_minutes",
      "cs.intake_token",
      "cs.mailbox_support",
      "cs.mailbox_complaints",
      "cs.lark_cs",
      "cs.lark_kyc",
      "cs.lark_tr",
      "cs.auto_reply_max_severity",
      "cs.sensitive_categories",
    ],
  },
];

const KEY_LABEL: Record<string, { en: string; zh: string }> = {
  "platform.name": { en: "Platform name", zh: "平台名稱" },
  "platform.owner_name": { en: "Platform owner", zh: "平台負責人" },
  "platform.owner_email": { en: "Owner email", zh: "負責人電子郵件" },
  "platform.docs_owner": { en: "Docs owner", zh: "文件負責人" },
  "products.coverage": { en: "Product coverage", zh: "產品涵蓋" },
  "monitor2.sync_enabled": { en: "Sync with Monitor 2.0", zh: "與 Monitor 2.0 同步" },
  "monitor2.base_url": { en: "Monitor 2.0 base URL", zh: "Monitor 2.0 網址" },
  "detectors.auto_raise_alarms": { en: "Detectors raise alarms", zh: "偵測器發出警報" },
  "ai.rca_enabled": { en: "Root-cause analysis", zh: "根因分析" },
  "ai.auto_on_alarm": { en: "Auto-analyse on alarm", zh: "警報時自動分析" },
  "ai.min_confidence": { en: "Minimum confidence", zh: "最低信心值" },
  "ai.second_opinion_severity": { en: "Second-opinion severity", zh: "第二意見嚴重度" },
  "ai.rag_top_k": { en: "RAG documents (top-K)", zh: "RAG 文件數（Top-K）" },
  "ai.skill_certainty_only": { en: "Execute skills only when certain", zh: "僅在確定時執行技能" },
  "ai.maker_checker_required": { en: "Maker / checker required", zh: "需 Maker／Checker" },
  "market_intel.enabled": { en: "Enable scanner", zh: "啟用掃描" },
  "market_intel.interval_minutes": { en: "Scan interval (minutes)", zh: "掃描間隔（分鐘）" },
  "market_intel.lark_chat_id": { en: "Intel Lark channel", zh: "情報 Lark 頻道" },
  "market_intel.raise_indicator_alarms": { en: "Raise indicator alarms", zh: "發出指標警報" },
  "lark.enabled": { en: "Lark notifications", zh: "Lark 通知" },
  "lark.app_id": { en: "Lark app id", zh: "Lark 應用 ID" },
  "escalation.default_sla_minutes": { en: "Default SLA (minutes)", zh: "預設 SLA（分鐘）" },
  "cs.followup_cap": { en: "Auto-email follow-up cap", zh: "自動追問信上限" },
  "cs.wait_sla_minutes": { en: "CS wait SLA (minutes)", zh: "CS 等待 SLA（分鐘）" },
  "cs.id_verify_sla_minutes": { en: "ID-verify SLA (minutes)", zh: "核身 SLA（分鐘）" },
  "cs.tr_sla_minutes": { en: "TR dealing SLA (minutes)", zh: "TR 成交 SLA（分鐘）" },
  "cs.risk_sla_minutes": { en: "CS→Risk SLA (minutes)", zh: "CS→風控 SLA（分鐘）" },
  "cs.intake_token": { en: "Intake webhook token", zh: "進件 webhook token" },
  "cs.mailbox_support": { en: "Support mailbox", zh: "客服信箱" },
  "cs.mailbox_complaints": { en: "Complaints mailbox", zh: "投訴信箱" },
  "cs.lark_cs": { en: "CS 24/7 Lark chat id", zh: "CS 24/7 Lark 頻道" },
  "cs.lark_kyc": { en: "CS KYC Lark chat id", zh: "CS 核身 Lark 頻道" },
  "cs.lark_tr": { en: "TR dealing Lark chat id", zh: "TR 成交 Lark 頻道" },
  "cs.auto_reply_max_severity": { en: "AI auto-reply max severity", zh: "AI 直回最高嚴重度" },
  "cs.sensitive_categories": { en: "Categories that need POC review", zh: "需 POC 審閱的類別" },
};

const OTHER: GroupDef = {
  id: "other",
  titleEn: "Other",
  titleZh: "其他",
  blurbEn: "Parameters that are not yet placed in a named group.",
  blurbZh: "尚未歸入具名分組的參數。",
  icon: Sparkles,
  keys: [],
};

function keyLabel(key: string, zh: boolean) {
  const hit = KEY_LABEL[key];
  if (!hit) return key;
  return zh ? hit.zh : hit.en;
}

export function SettingsManager({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [msg, setMsg] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byKey = new Map(settings.map((s) => [s.key, s]));
    const used = new Set<string>();
    const sections = GROUPS.map((g) => {
      const items = g.keys.map((k) => byKey.get(k)).filter((s): s is Setting => !!s);
      items.forEach((s) => used.add(s.key));
      return { ...g, items };
    }).filter((g) => g.items.length);
    const leftover = settings.filter((s) => !used.has(s.key)).sort((a, b) => a.key.localeCompare(b.key));
    if (leftover.length) sections.push({ ...OTHER, items: leftover });
    return sections;
  }, [settings]);

  async function save(key: string) {
    if (isPublicSnapshot()) {
      setMsg(
        zh
          ? `已儲存 ${key}（公開快照 — 僅存於此瀏覽器）`
          : `Saved ${key} (public snapshot — stored in this browser only)`
      );
      return;
    }
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: values[key] }),
    });
    if (res.status === 404 || res.status === 405) {
      setMsg(
        zh
          ? `已儲存 ${key}（公開快照 — 僅存於此瀏覽器）`
          : `Saved ${key} (public snapshot — stored in this browser only)`
      );
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || (zh ? "儲存失敗" : "Save failed"));
      return;
    }
    setMsg(zh ? `已儲存 ${key}` : `Saved ${key}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">{msg}</div>
      )}

      <nav className="flex flex-wrap gap-2" aria-label={zh ? "設定分組" : "Setting groups"}>
        {grouped.map((g) => {
          const Icon = g.icon;
          return (
            <a
              key={g.id}
              href={`#settings-${g.id}`}
              className="btn !min-h-9 text-xs inline-flex items-center gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {zh ? g.titleZh : g.titleEn}
            </a>
          );
        })}
      </nav>

      {grouped.map((g) => {
        const Icon = g.icon;
        return (
          <section
            key={g.id}
            id={`settings-${g.id}`}
            className="panel overflow-hidden scroll-mt-24"
          >
            <header className="border-b border-[var(--line)] bg-teal-50/60 px-4 py-3 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-[family-name:var(--font-display)] text-lg leading-tight">
                  {zh ? g.titleZh : g.titleEn}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{zh ? g.blurbZh : g.blurbEn}</p>
              </div>
              <div className="ml-auto hidden sm:block text-xs tabular-nums text-[var(--muted)]">
                {g.items.length} {zh ? "項" : g.items.length === 1 ? "parameter" : "parameters"}
              </div>
            </header>
            <div className="divide-y divide-[var(--line)]">
              {g.items.map((s) => (
                <div
                  key={s.key}
                  className="p-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(12rem,1fr)] lg:items-start"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">{keyLabel(s.key, zh)}</div>
                    <div className="text-[11px] font-mono text-[var(--muted)] mt-0.5 break-all">{s.key}</div>
                    {s.description ? (
                      <div className="text-sm text-[var(--muted)] mt-1">{phrase(s.description, locale)}</div>
                    ) : null}
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {zh ? "更新於" : "Updated"} {s.updated_at}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                    <input
                      className={cn("input flex-1 min-w-0")}
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      aria-label={keyLabel(s.key, zh)}
                    />
                    <button className="btn btn-primary shrink-0 justify-center" onClick={() => save(s.key)}>
                      {zh ? "儲存" : "Save"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
