"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLink } from "@/components/AdminLink";
import { Badge } from "@/components/ui";
import { MonitorCode } from "@/components/MonitorCode";
import { SKILL_SCENARIOS, LINKED_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";
import { finalizeSkill } from "@/lib/ai/skill-playbook";
import { CHAIN_ZH } from "@/lib/ai/skill-zh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t, phrase, type UiLocale } from "@/lib/i18n";

type RagDoc = {
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
  tags: string[];
};

type ProductFilter = "ALL" | "CFD" | "Crypto";
type ViewMode = "map" | "outline";
type Trunk = "domains" | "chains" | "rag";

const DOMAIN_COLOR: Record<string, string> = {
  CREDIT_CLIENT: "#0b6e6a",
  LP_HEDGE: "#c45c26",
  MARKET_PRICING: "#1d4ed8",
  CRYPTO_EXCHANGE: "#6d28d9",
  FRAUD_CONDUCT: "#be123c",
  PRODUCT_CONFIG: "#0f766e",
  MODEL_AI: "#4338ca",
  OPS_PROCESS: "#0369a1",
  REG_CAPITAL: "#a16207",
  TECH_INFRA: "#334155",
};

const W = 1120;

function domainFill(code: string) {
  return DOMAIN_COLOR[code] || "#10233a";
}

function prettyDomain(code: string, locale: UiLocale) {
  return phrase(code, locale);
}

function shortSkill(code: string) {
  return code.replace(/^SKILL-/, "");
}

function productMatch(product: string, filter: ProductFilter) {
  if (filter === "ALL") return true;
  const p = product.toUpperCase();
  if (filter === "CFD") return p.includes("CFD");
  return p.includes("CRYPTO");
}

function docsForSkill(skill: (typeof SKILL_SCENARIOS)[number], docs: RagDoc[]): RagDoc[] {
  const blob = `${skill.code} ${skill.name} ${skill.description} ${skill.indicator.domain} ${skill.indicator.product} ${skill.indicator.name}`.toLowerCase();
  const tokens = new Set(blob.split(/[^a-z0-9]+/).filter((t) => t.length > 3));
  if (/MARGIN|COPY|CREDIT/.test(skill.code)) {
    tokens.add("margin");
    tokens.add("copy");
    tokens.add("credit");
  }
  if (/LP|HEDGE|ABOOK/.test(skill.code)) {
    tokens.add("hedge");
    tokens.add("lp");
  }
  if (/CRYPTO|WALLET/.test(skill.code)) {
    tokens.add("crypto");
    tokens.add("wallet");
  }
  if (/XAU|GOLD/.test(skill.code)) tokens.add("gold");
  if (/FRAUD|BONUS|WASH/.test(skill.code)) tokens.add("fraud");
  return docs
    .map((d) => {
      const hay = `${d.title} ${d.category} ${d.product_scope} ${d.tags.join(" ")}`.toLowerCase();
      let score = 0;
      for (const tok of tokens) if (hay.includes(tok)) score += 1;
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.d);
}

function linkPath(x1: number, y1: number, x2: number, y2: number) {
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

export function KnowledgeTreeBoard({ docs }: { docs: RagDoc[] }) {
  const { locale } = useUiLocale();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("map");
  const [filter, setFilter] = useState<ProductFilter>("ALL");
  const [trunk, setTrunk] = useState<Trunk>("domains");
  const [domain, setDomain] = useState<string | null>("CREDIT_CLIENT");
  const [skillCode, setSkillCode] = useState<string | null>("SKILL-MARGIN-SPIKE");
  const [chainCode, setChainCode] = useState<string | null>(null);
  const [ragCat, setRagCat] = useState<string | null>(null);

  const skills = useMemo(
    () => SKILL_SCENARIOS.filter((s) => productMatch(s.indicator.product, filter)),
    [filter]
  );
  const chains = useMemo(
    () => LINKED_SCENARIOS.filter((c) => productMatch(c.product, filter)),
    [filter]
  );
  const ragDocs = useMemo(
    () => docs.filter((d) => productMatch(d.product_scope, filter)),
    [docs, filter]
  );

  const domains = useMemo(() => {
    const map = new Map<string, typeof SKILL_SCENARIOS>();
    for (const s of skills) {
      const d = s.indicator.domain || "OTHER";
      const list = map.get(d) || [];
      list.push(s);
      map.set(d, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [skills]);

  const ragByCat = useMemo(() => {
    const map = new Map<string, RagDoc[]>();
    for (const d of ragDocs) {
      const list = map.get(d.category) || [];
      list.push(d);
      map.set(d.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ragDocs]);

  const activeDomain = domain && domains.some(([d]) => d === domain) ? domain : domains[0]?.[0] || null;
  const selectedSkill = skills.find((s) => s.code === skillCode) || null;
  const selectedChain = chains.find((c) => c.code === chainCode) || null;
  const domainSkills = domains.find(([d]) => d === activeDomain)?.[1] || [];
  const relatedDocs = selectedSkill ? docsForSkill(selectedSkill, ragDocs) : [];
  const relatedChains = selectedSkill
    ? chains.filter((c) => c.linked_skills.includes(selectedSkill.code))
    : activeDomain
      ? chains.filter((c) => c.domain === activeDomain)
      : [];

  const root = { x: W / 2, y: 38 };
  const trunks: { id: Trunk; x: number; y: number; label: string; count: number }[] = [
    { id: "domains", x: 220, y: 128, label: t("tree.domains", locale), count: domains.length },
    { id: "chains", x: W / 2, y: 128, label: t("tree.chains", locale), count: chains.length },
    { id: "rag", x: 900, y: 128, label: t("tree.rag", locale), count: ragDocs.length },
  ];

  const domainCols = Math.min(5, Math.max(domains.length, 1));
  const domainRows = Math.ceil((domains.length || 1) / domainCols) || 1;
  const domainNodes = domains.map(([code, list], i) => {
    const col = i % domainCols;
    const row = Math.floor(i / domainCols);
    const gap = (W - 72) / domainCols;
    return { code, count: list.length, x: 36 + gap / 2 + col * gap, y: 214 + row * 62, fill: domainFill(code) };
  });

  const skillOriginY = 214 + domainRows * 62 + 52;
  const skillNodes = domainSkills.slice(0, 16).map((s, i) => {
    const cols = Math.min(4, Math.max(domainSkills.length, 1));
    const col = i % cols;
    const row = Math.floor(i / cols);
    const gap = 250;
    const start = (W - (cols - 1) * gap) / 2;
    return { skill: s, x: start + col * gap, y: skillOriginY + row * 78 };
  });

  const chainNodes = chains.slice(0, 12).map((c, i) => {
    const cols = 3;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const gap = 340;
    const start = (W - (cols - 1) * gap) / 2;
    return { chain: c, x: start + col * gap, y: 220 + row * 76 };
  });

  const ragCols = Math.min(4, Math.max(ragByCat.length, 1));
  const ragNodes = ragByCat.map(([cat, list], i) => {
    const col = i % ragCols;
    const row = Math.floor(i / ragCols);
    const gap = (W - 80) / ragCols;
    return { cat, count: list.length, x: 40 + gap / 2 + col * gap, y: 220 + row * 70 };
  });

  const skillRows = Math.ceil(Math.max(Math.min(domainSkills.length, 16), 1) / 4);
  const chainRows = Math.ceil(Math.min(chains.length, 12) / 3);
  const ragRows = Math.ceil((ragByCat.length || 1) / ragCols);
  const H =
    trunk === "chains"
      ? 220 + chainRows * 76 + 48
      : trunk === "rag"
        ? 220 + ragRows * 70 + 48
        : skillOriginY + skillRows * 78 + 36;

  function pickDomain(code: string) {
    setTrunk("domains");
    setDomain(code);
    setSkillCode(null);
    setChainCode(null);
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <p className="text-sm text-[var(--muted)]">{t("tree.hint", locale)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">
            {t("tree.domains", locale)} · {domains.length}
          </Badge>
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">
            {t("tree.skills", locale)} · {skills.length}
          </Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {t("tree.chains", locale)} · {chains.length}
          </Badge>
          <Badge className="bg-emerald-50 text-emerald-900 border-emerald-200">
            {t("tree.rag", locale)} · {ragDocs.length}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["map", "outline"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`btn text-xs ${view === m ? "btn-primary" : ""}`}
              onClick={() => setView(m)}
            >
              {m === "map" ? t("tree.map", locale) : t("tree.outline", locale)}
            </button>
          ))}
          {(["ALL", "CFD", "Crypto"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn text-xs ${filter === p ? "btn-primary" : ""}`}
              onClick={() => {
                setFilter(p);
                setSkillCode(null);
              }}
            >
              {p === "ALL" ? t("tree.allProducts", locale) : p}
            </button>
          ))}
        </div>
      </div>

      {view === "map" ? (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-3">
          <div className="panel p-3 overflow-x-auto">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full min-w-[860px] h-auto"
              role="img"
              aria-label={t("tree.map", locale)}
            >
              <defs>
                <linearGradient id="crmpHub" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0b6e6a" />
                  <stop offset="100%" stopColor="#10233a" />
                </linearGradient>
                <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodOpacity="0.18" />
                </filter>
              </defs>

              {trunks.map((tr) => (
                <path
                  key={`r-${tr.id}`}
                  d={linkPath(root.x, root.y + 22, tr.x, tr.y - 22)}
                  fill="none"
                  stroke={trunk === tr.id ? "#0b6e6a" : "#c5d0db"}
                  strokeWidth={trunk === tr.id ? 2.4 : 1.4}
                />
              ))}

              {trunk === "domains" &&
                domainNodes.map((n) => (
                  <path
                    key={`td-${n.code}`}
                    d={linkPath(220, 150, n.x, n.y - 22)}
                    fill="none"
                    stroke={domain === n.code ? n.fill : "#d7dee7"}
                    strokeWidth={domain === n.code ? 2.2 : 1.2}
                  />
                ))}

              {trunk === "domains" &&
                domain &&
                skillNodes.map((n) => (
                  <path
                    key={`ds-${n.skill.code}`}
                    d={linkPath(
                      domainNodes.find((d) => d.code === activeDomain)?.x || 220,
                      (domainNodes.find((d) => d.code === activeDomain)?.y || 214) + 22,
                      n.x,
                      n.y - 20
                    )}
                    fill="none"
                    stroke={skillCode === n.skill.code ? domainFill(activeDomain || "") : "#d7dee7"}
                    strokeWidth={skillCode === n.skill.code ? 2 : 1.1}
                  />
                ))}

              {trunk === "chains" &&
                chainNodes.map((n) => (
                  <path
                    key={`tc-${n.chain.code}`}
                    d={linkPath(W / 2, 150, n.x, n.y - 18)}
                    fill="none"
                    stroke={chainCode === n.chain.code ? "#c45c26" : "#d7dee7"}
                    strokeWidth={chainCode === n.chain.code ? 2 : 1.1}
                  />
                ))}

              {trunk === "rag" &&
                ragNodes.map((n) => (
                  <path
                    key={`tr-${n.cat}`}
                    d={linkPath(900, 150, n.x, n.y - 18)}
                    fill="none"
                    stroke={ragCat === n.cat ? "#0f766e" : "#d7dee7"}
                    strokeWidth={ragCat === n.cat ? 2 : 1.1}
                  />
                ))}

              <HubNode
                x={root.x}
                y={root.y}
                label="CRMP"
                sub={t("tree.hubSub", locale)}
                fill="url(#crmpHub)"
                wide
              />

              {trunks.map((tr) => (
                <HubNode
                  key={tr.id}
                  x={tr.x}
                  y={tr.y}
                  label={tr.label}
                  sub={`${tr.count}`}
                  fill={trunk === tr.id ? "#0b6e6a" : "#10233a"}
                  active={trunk === tr.id}
                  onClick={() => {
                    setTrunk(tr.id);
                    setSkillCode(null);
                    if (tr.id === "domains" && !domain && domains[0]) setDomain(domains[0][0]);
                  }}
                />
              ))}

              {trunk === "domains" &&
                domainNodes.map((n) => (
                  <HubNode
                    key={n.code}
                    x={n.x}
                    y={n.y}
                    label={prettyDomain(n.code, locale)}
                    sub={`${n.count} ${t("tree.skills", locale)}`}
                    fill={n.fill}
                    active={activeDomain === n.code}
                    compact
                    wide
                    onClick={() => pickDomain(n.code)}
                  />
                ))}

              {trunk === "domains" &&
                skillNodes.map((n) => (
                  <SkillNode
                    key={n.skill.code}
                    x={n.x}
                    y={n.y}
                    code={n.skill.code}
                    name={finalizeSkill(n.skill, locale).name}
                    monitor={n.skill.indicator.monitor_id}
                    active={skillCode === n.skill.code}
                    accent={domainFill(n.skill.indicator.domain)}
                    onClick={() => setSkillCode(n.skill.code)}
                    onEnter={() => router.push(`/admin/skills/${encodeURIComponent(n.skill.code)}`)}
                    locale={locale}
                  />
                ))}

              {trunk === "chains" &&
                chainNodes.map((n) => {
                  const zh = locale === "zh-Hant" ? CHAIN_ZH[n.chain.code] : undefined;
                  return (
                    <HubNode
                      key={n.chain.code}
                      x={n.x}
                      y={n.y}
                      label={n.chain.code.replace(/^CHAIN-/, "")}
                      sub={zh?.name || n.chain.name}
                      fill={chainCode === n.chain.code ? "#c45c26" : "#10233a"}
                      compact
                      wide
                      active={chainCode === n.chain.code}
                      onClick={() => setChainCode(n.chain.code)}
                    />
                  );
                })}

              {trunk === "rag" &&
                ragNodes.map((n) => (
                  <HubNode
                    key={n.cat}
                    x={n.x}
                    y={n.y}
                    label={n.cat.replace(/_/g, " ")}
                    sub={`${n.count}`}
                    fill={ragCat === n.cat ? "#0f766e" : "#0b6e6a"}
                    compact
                    wide
                    active={ragCat === n.cat}
                    onClick={() => setRagCat(n.cat)}
                  />
                ))}
            </svg>
            <p className="text-[11px] text-[var(--muted)] mt-1 px-1">{t("tree.clickNode", locale)}</p>
          </div>

          <Inspector
            locale={locale}
            trunk={trunk}
            domain={activeDomain}
            skill={selectedSkill}
            chain={selectedChain}
            relatedChains={relatedChains}
            relatedDocs={relatedDocs}
            ragCat={ragCat}
            ragDocs={ragCat ? ragByCat.find(([c]) => c === ragCat)?.[1] || [] : []}
          />
        </div>
      ) : (
        <Outline
          locale={locale}
          domains={domains}
          openDomain={activeDomain}
          setOpenDomain={setDomain}
          chains={chains}
          ragByCat={ragByCat}
        />
      )}
    </div>
  );
}

function HubNode({
  x,
  y,
  label,
  sub,
  fill,
  onClick,
  active,
  compact,
  wide,
}: {
  x: number;
  y: number;
  label: string;
  sub?: string;
  fill: string;
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
  wide?: boolean;
}) {
  const w = wide ? (compact ? 200 : 168) : compact ? 118 : 148;
  const h = compact ? 44 : 48;
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : undefined}
      filter="url(#nodeShadow)"
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={12}
        fill={fill}
        stroke={active ? "#f8fafc" : "transparent"}
        strokeWidth={active ? 2 : 0}
      />
      <text textAnchor="middle" y={sub ? -4 : 4} fill="#fff" fontSize={compact ? 10 : 12} fontWeight={700}>
        {label.length > 18 ? `${label.slice(0, 17)}…` : label}
      </text>
      {sub ? (
        <text textAnchor="middle" y={12} fill="#d7e2ef" fontSize={9}>
          {sub.length > 28 ? `${sub.slice(0, 27)}…` : sub}
        </text>
      ) : null}
    </g>
  );
}

function SkillNode({
  x,
  y,
  code,
  name,
  monitor,
  active,
  accent,
  onClick,
  onEnter,
  locale,
}: {
  x: number;
  y: number;
  code: string;
  name: string;
  monitor: string;
  active: boolean;
  accent: string;
  onClick: () => void;
  onEnter: () => void;
  locale: UiLocale;
}) {
  const w = 228;
  const h = 56;
  return (
    <g transform={`translate(${x}, ${y})`} className="cursor-pointer" onClick={onClick} filter="url(#nodeShadow)">
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={12}
        fill="#fff"
        stroke={active ? accent : "#d7dee7"}
        strokeWidth={active ? 2.4 : 1}
      />
      <rect x={-w / 2} y={-h / 2} width={8} height={h} rx={4} fill={accent} />
      <text
        x={-w / 2 + 18}
        y={-6}
        fill="#0b6e6a"
        fontSize={11}
        fontWeight={700}
        onClick={(e) => {
          e.stopPropagation();
          onEnter();
        }}
      >
        {shortSkill(code)}
      </text>
      <text x={-w / 2 + 18} y={10} fill="#5b6b7c" fontSize={9}>
        {(name.length > 28 ? `${name.slice(0, 27)}…` : name) + " · " + monitor}
      </text>
      <text
        x={w / 2 - 10}
        y={4}
        textAnchor="end"
        fill={accent}
        fontSize={9}
        fontWeight={700}
        onClick={(e) => {
          e.stopPropagation();
          onEnter();
        }}
      >
        {t("tree.enter", locale)} →
      </text>
    </g>
  );
}

function Inspector({
  locale,
  trunk,
  domain,
  skill,
  chain,
  relatedChains,
  relatedDocs,
  ragCat,
  ragDocs,
}: {
  locale: UiLocale;
  trunk: Trunk;
  domain: string | null;
  skill: (typeof SKILL_SCENARIOS)[number] | null;
  chain: (typeof LINKED_SCENARIOS)[number] | null;
  relatedChains: typeof LINKED_SCENARIOS;
  relatedDocs: RagDoc[];
  ragCat: string | null;
  ragDocs: RagDoc[];
}) {
  const playbook = skill ? finalizeSkill(skill, locale) : null;
  const chainZh = chain && locale === "zh-Hant" ? CHAIN_ZH[chain.code] : undefined;

  return (
    <aside className="panel p-4 min-h-[280px]">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{t("tree.inspector", locale)}</div>
      {playbook ? (
        <div className="mt-2 space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg leading-snug">{playbook.name}</h2>
          <div className="flex flex-wrap gap-1.5">
            <Badge className="bg-teal-50 text-teal-900 border-teal-200">{playbook.code}</Badge>
            <MonitorCode
              id={playbook.indicator.monitor_id}
              name={playbook.indicator.name}
              unit={playbook.indicator.unit}
            />
            <Badge className="bg-orange-50 text-orange-900 border-orange-200">{playbook.indicator.product}</Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">{playbook.description}</p>
          <AdminLink href={`/admin/skills/${encodeURIComponent(playbook.code)}`} className="btn btn-primary text-xs">
            {t("tree.enterPlaybook", locale)}
          </AdminLink>
          {relatedChains.length ? (
            <div>
              <div className="text-xs uppercase text-[var(--muted)] mb-1">{t("tree.chains", locale)}</div>
              <ul className="text-sm space-y-1">
                {relatedChains.slice(0, 4).map((c) => (
                  <li key={c.code} className="text-[var(--muted)]">
                    {c.code.replace(/^CHAIN-/, "")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {relatedDocs.length ? (
            <div>
              <div className="text-xs uppercase text-[var(--muted)] mb-1">{t("tree.rag", locale)}</div>
              <ul className="text-sm space-y-1">
                {relatedDocs.map((d) => (
                  <li key={d.doc_key}>
                    <AdminLink href="/admin/rag" className="text-teal-800 underline">
                      {d.title}
                    </AdminLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : chain ? (
        <div className="mt-2 space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{chainZh?.name || chain.name}</h2>
          <p className="text-sm text-[var(--muted)]">{chainZh?.description || chain.description}</p>
          <div className="text-xs uppercase text-[var(--muted)]">{t("tree.linkedSkills", locale)}</div>
          <ul className="text-sm space-y-1">
            {chain.linked_skills.map((code) => (
              <li key={code}>
                <AdminLink href={`/admin/skills/${encodeURIComponent(code)}`} className="text-teal-800 underline">
                  {code}
                </AdminLink>
              </li>
            ))}
          </ul>
        </div>
      ) : trunk === "rag" ? (
        <div className="mt-2 space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{ragCat || t("tree.rag", locale)}</h2>
          <ul className="text-sm space-y-1.5">
            {(ragDocs.length ? ragDocs : []).map((d) => (
              <li key={d.doc_key}>
                <AdminLink href="/admin/rag" className="text-teal-800 underline">
                  {d.title}
                </AdminLink>
                <div className="text-xs text-[var(--muted)]">{d.product_scope}</div>
              </li>
            ))}
          </ul>
          <AdminLink href="/admin/rag" className="btn text-xs">
            {t("tree.openRag", locale)}
          </AdminLink>
        </div>
      ) : (
        <div className="mt-3 text-sm text-[var(--muted)]">
          <p>{t("tree.inspectorEmpty", locale)}</p>
          {domain ? (
            <p className="mt-2">
              {prettyDomain(domain, locale)} · {t("tree.skillsInDomain", locale)}
            </p>
          ) : null}
        </div>
      )}
    </aside>
  );
}

function Outline({
  locale,
  domains,
  openDomain,
  setOpenDomain,
  chains,
  ragByCat,
}: {
  locale: UiLocale;
  domains: [string, typeof SKILL_SCENARIOS][];
  openDomain: string | null;
  setOpenDomain: (d: string | null) => void;
  chains: typeof LINKED_SCENARIOS;
  ragByCat: [string, RagDoc[]][];
}) {
  return (
    <div className="panel p-4 overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="font-[family-name:var(--font-display)] text-lg mb-4">CRMP</div>
        <div className="relative pl-6 border-l-2 border-teal-200 space-y-6">
          <section className="relative">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-teal-600" />
            <h2 className="font-[family-name:var(--font-display)] text-base mb-2">{t("tree.domains", locale)}</h2>
            {domains.map(([dom, list]) => {
              const expanded = openDomain === dom || openDomain === null;
              return (
                <div key={dom} className="relative mb-2">
                  <button type="button" className="font-semibold text-sm" onClick={() => setOpenDomain(openDomain === dom ? null : dom)}>
                    {dom} <span className="text-xs text-[var(--muted)]">({list.length})</span>
                  </button>
                  {expanded && (
                    <ul className="mt-2 ml-4 space-y-1.5">
                      {list.map((raw) => {
                        const s = finalizeSkill(raw, locale);
                        return (
                          <li key={s.code} className="text-sm">
                            <AdminLink href={`/admin/skills/${encodeURIComponent(s.code)}`} className="text-teal-800 underline">
                              {s.code}
                            </AdminLink>
                            <span className="text-[var(--muted)]"> — {s.name}</span>
                            <span className="ml-2">
                              <MonitorCode id={s.indicator.monitor_id} name={s.indicator.name} />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
          <section className="relative">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-teal-600" />
            <h2 className="font-[family-name:var(--font-display)] text-base mb-2">{t("tree.chains", locale)}</h2>
            <ul className="ml-4 space-y-1.5">
              {chains.map((c) => {
                const zh = locale === "zh-Hant" ? CHAIN_ZH[c.code] : undefined;
                return (
                  <li key={c.code} className="text-sm">
                    <span className="font-semibold">{c.code}</span>
                    <span className="text-[var(--muted)]"> — {zh?.name || c.name}</span>
                    <div className="text-xs text-[var(--muted)]">{c.linked_skills.join(", ")}</div>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="relative">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-teal-600" />
            <h2 className="font-[family-name:var(--font-display)] text-base mb-2">{t("tree.rag", locale)}</h2>
            {ragByCat.map(([cat, list]) => (
              <div key={cat} className="ml-4 mb-3">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{cat}</div>
                <ul className="mt-1 space-y-1">
                  {list.map((d) => (
                    <li key={d.doc_key} className="text-sm">
                      <AdminLink href="/admin/rag" className="text-teal-800 underline">
                        {d.title}
                      </AdminLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
