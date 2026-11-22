import { ARTICLES } from "@/lib/data/articles";
import { ACCESS_PLACEHOLDERS, DB_SYSTEMS } from "@/lib/data/databases";
import { PIPELINE_STAGES, PIPELINE_SUMMARY } from "@/lib/data/pipeline";
import { RISK_SCENARIOS } from "@/lib/data/risks";
import { SKILLS } from "@/lib/data/skills";
import type { KnowledgeChunk } from "@/lib/types";

let cached: KnowledgeChunk[] | null = null;

function riskChunk(r: (typeof RISK_SCENARIOS)[number]): KnowledgeChunk {
  return {
    id: `risk-${r.id}`,
    title: `#${r.id} ${r.title}`,
    titleZh: `#${r.id} ${r.titleZh}`,
    section: r.category,
    sectionZh: r.category,
    kind: "risk",
    body: [
      r.howItWorks,
      `Classes: ${r.classes.join("/")}`,
      `Frequency ${r.frequency} · Severity ${r.severity}`,
      `Detect: ${r.detect.join("; ")}`,
      `Prevent: ${r.prevent.join("; ")}`,
      `Owners: ${r.owners.join(", ")}`,
      `Tags: ${r.tags.join(", ")}`,
    ].join("\n"),
    bodyZh: [
      r.howItWorksZh,
      `分类: ${r.classes.join("/")}`,
      `频率 ${r.frequency} · 严重度 ${r.severity}`,
      `检测: ${r.detectZh.join("; ")}`,
      `防控: ${r.preventZh.join("; ")}`,
      `负责: ${r.owners.join(", ")}`,
      `标签: ${r.tags.join(", ")}`,
    ].join("\n"),
    tags: [...r.tags, r.category, ...r.classes, r.severity, r.frequency, r.slug],
    href: `/risks/${r.id}`,
  };
}

function skillChunk(s: (typeof SKILLS)[number]): KnowledgeChunk {
  return {
    id: `skill-${s.id}`,
    title: s.title,
    titleZh: s.titleZh,
    section: "skills",
    sectionZh: "技能库",
    kind: "skill",
    body: [
      s.summary,
      `Severity ${s.severity}`,
      `Owners: ${s.owners.join(", ")}`,
      `Triggers: ${s.triggers.join("; ")}`,
      `Steps: ${s.steps.map((st) => st.title).join(" → ")}`,
      `Evidence: ${s.evidence.join("; ")}`,
      `Related risks: ${s.relatedRiskIds.join(", ")}`,
    ].join("\n"),
    bodyZh: [
      s.summaryZh,
      `严重度 ${s.severity}`,
      `负责: ${s.owners.join(", ")}`,
      `触发: ${s.triggersZh.join("; ")}`,
      `步骤: ${s.steps.map((st) => st.titleZh).join(" → ")}`,
      `证据: ${s.evidenceZh.join("; ")}`,
      `相关风险: ${s.relatedRiskIds.join(", ")}`,
    ].join("\n"),
    tags: [...s.tags, "skill", s.severity, s.slug],
    href: `/skills/${s.slug}`,
  };
}

export function buildCorpus(): KnowledgeChunk[] {
  if (cached) return cached;

  const chunks: KnowledgeChunk[] = [];

  for (const a of ARTICLES) {
    chunks.push({
      id: `article-${a.id}`,
      title: a.title,
      titleZh: a.titleZh,
      section: "knowledge",
      sectionZh: "知识",
      kind: "article",
      body: `${a.summary}\n\n${a.body}`,
      bodyZh: `${a.summaryZh}\n\n${a.bodyZh}`,
      tags: [...a.tags, a.slug],
      href: `/knowledge/${a.slug}`,
    });
  }

  chunks.push({
    id: "pipeline-overview",
    title: "LP → PE → MT Pricing Pipeline",
    titleZh: "LP → PE → MT 报价全流程",
    section: "pipeline",
    sectionZh: "报价链路",
    kind: "pipeline",
    body: [
      PIPELINE_SUMMARY.principle,
      PIPELINE_SUMMARY.evidenceChain,
      ...PIPELINE_STAGES.map(
        (st) =>
          `${st.name}: ${st.role} Failures: ${st.failureModes.join("; ")}. Checks: ${st.checks.join("; ")}. Systems: ${st.systems.join(", ")}.`,
      ),
    ].join("\n\n"),
    bodyZh: [
      PIPELINE_SUMMARY.principleZh,
      PIPELINE_SUMMARY.evidenceChainZh,
      ...PIPELINE_STAGES.map(
        (st) =>
          `${st.nameZh}: ${st.roleZh} 故障: ${st.failureModesZh.join("; ")}。检查: ${st.checksZh.join("; ")}。系统: ${st.systems.join(", ")}。`,
      ),
    ].join("\n\n"),
    tags: ["pipeline", "lp", "pe", "mt", "pricing"],
    href: "/pipeline",
  });

  for (const st of PIPELINE_STAGES) {
    chunks.push({
      id: `pipeline-${st.id}`,
      title: st.name,
      titleZh: st.nameZh,
      section: "pipeline",
      sectionZh: "报价链路",
      kind: "pipeline",
      body: `${st.role}\nInputs: ${st.inputs.join("; ")}\nOutputs: ${st.outputs.join("; ")}\nFailures: ${st.failureModes.join("; ")}\nChecks: ${st.checks.join("; ")}`,
      bodyZh: `${st.roleZh}\n输入: ${st.inputs.join("; ")}\n输出: ${st.outputs.join("; ")}\n故障: ${st.failureModesZh.join("; ")}\n检查: ${st.checksZh.join("; ")}`,
      tags: ["pipeline", st.id, ...st.systems.map((x) => x.toLowerCase())],
      href: `/pipeline#${st.id}`,
    });
  }

  chunks.push({
    id: "db-overview",
    title: "Pricing Ops Database Architecture",
    titleZh: "报价运维数据库架构",
    section: "database",
    sectionZh: "数据库",
    kind: "database",
    body: [
      ACCESS_PLACEHOLDERS.note,
      `VPN: ${ACCESS_PLACEHOLDERS.vpn}`,
      `Bastion: ${ACCESS_PLACEHOLDERS.bastion}`,
      `BI: ${ACCESS_PLACEHOLDERS.bi}`,
      `Grafana: ${ACCESS_PLACEHOLDERS.grafana}`,
      ...DB_SYSTEMS.map(
        (d) =>
          `${d.name} (${d.engine}) host=${d.hostPlaceholder}:${d.portPlaceholder} — ${d.purpose} Tables: ${d.keyTables.map((t) => t.name).join(", ")}`,
      ),
    ].join("\n"),
    bodyZh: [
      ACCESS_PLACEHOLDERS.noteZh,
      `VPN: ${ACCESS_PLACEHOLDERS.vpn}`,
      `Bastion: ${ACCESS_PLACEHOLDERS.bastion}`,
      `BI: ${ACCESS_PLACEHOLDERS.bi}`,
      `Grafana: ${ACCESS_PLACEHOLDERS.grafana}`,
      ...DB_SYSTEMS.map(
        (d) =>
          `${d.nameZh} (${d.engine}) host=${d.hostPlaceholder}:${d.portPlaceholder} — ${d.purposeZh} 表: ${d.keyTables.map((t) => t.name).join(", ")}`,
      ),
    ].join("\n"),
    tags: ["database", "access", "architecture"],
    href: "/data",
  });

  for (const d of DB_SYSTEMS) {
    chunks.push({
      id: `db-${d.id}`,
      title: d.name,
      titleZh: d.nameZh,
      section: "database",
      sectionZh: "数据库",
      kind: "database",
      body: `${d.purpose}\nEngine: ${d.engine}\nHost: ${d.hostPlaceholder}:${d.portPlaceholder}\n${d.schemaNotes}\nTables: ${d.keyTables.map((t) => `${t.name} — ${t.description}`).join("; ")}\nAccess: ${d.accessRoles.join(", ")}\nOwner: ${d.owner}`,
      bodyZh: `${d.purposeZh}\n引擎: ${d.engine}\n地址: ${d.hostPlaceholder}:${d.portPlaceholder}\n${d.schemaNotesZh}\n表: ${d.keyTables.map((t) => `${t.name} — ${t.descriptionZh}`).join("; ")}\n权限: ${d.accessRoles.join(", ")}\nOwner: ${d.owner}`,
      tags: ["database", d.id, d.engine.toLowerCase()],
      href: `/data#${d.id}`,
    });
  }

  for (const r of RISK_SCENARIOS) chunks.push(riskChunk(r));
  for (const s of SKILLS) chunks.push(skillChunk(s));

  cached = chunks;
  return chunks;
}
