import { ARTICLES } from "@/lib/data/articles";
import { ACCESS_PLACEHOLDERS, DB_SYSTEMS } from "@/lib/data/databases";
import { PIPELINE_STAGES, PIPELINE_SUMMARY } from "@/lib/data/pipeline";
import { RISK_SCENARIOS } from "@/lib/data/risks";
import { SKILLS } from "@/lib/data/skills";
import { VE_DOCS, VE_META } from "@/lib/data/vexchange";
import { sql } from "@/lib/db";
import type { Actor } from "@/lib/auth";
import { mirrorMissingLocale } from "@/lib/kb/bilingual";
import { productOfNode, type ProductId } from "@/lib/kb/products";
import type { KbKind, KbMedia, KbNode, KbNodeInput, KbRevision, TreeNode } from "@/lib/kb/types";

let seeded = false;

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return v as T;
}

function rowToNode(row: Record<string, unknown>): KbNode {
  return {
    id: String(row.id),
    parentId: row.parent_id == null ? null : String(row.parent_id),
    kind: row.kind as KbKind,
    slug: String(row.slug),
    titleZh: String(row.title_zh ?? ""),
    titleEn: String(row.title_en ?? ""),
    summaryZh: String(row.summary_zh ?? ""),
    summaryEn: String(row.summary_en ?? ""),
    bodyZh: String(row.body_zh ?? ""),
    bodyEn: String(row.body_en ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    tags: parseJson(row.tags, [] as string[]),
    payload: parseJson(row.payload, {} as Record<string, unknown>),
    status: (row.status as KbNode["status"]) || "published",
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    createdBy: String(row.created_by ?? ""),
    updatedBy: String(row.updated_by ?? ""),
  };
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, (m) => `zh-${m.length}`)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base || `node-${Date.now().toString(36)}`;
}

async function uniqueSlug(preferred: string, excludeId?: string): Promise<string> {
  let slug = preferred || `node-${Date.now().toString(36)}`;
  for (let i = 0; i < 20; i++) {
    const rows = await sql<{ id: string }>("select id from kb_nodes where slug = $1 limit 1", [slug]);
    if (!rows[0] || (excludeId && rows[0].id === excludeId)) return slug;
    slug = `${preferred}-${i + 2}`;
  }
  return `${preferred}-${Date.now().toString(36)}`;
}

async function insertNodeRaw(node: KbNode): Promise<void> {
  await sql(
    `insert into kb_nodes (
      id, parent_id, kind, slug, title_zh, title_en, summary_zh, summary_en,
      body_zh, body_en, sort_order, tags, payload, status,
      created_at, updated_at, created_by, updated_by
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12::jsonb,$13::jsonb,$14,
      $15,$16,$17,$18
    )
    on conflict (id) do nothing`,
    [
      node.id,
      node.parentId,
      node.kind,
      node.slug,
      node.titleZh,
      node.titleEn,
      node.summaryZh,
      node.summaryEn,
      node.bodyZh,
      node.bodyEn,
      node.sortOrder,
      JSON.stringify(node.tags),
      JSON.stringify(node.payload),
      node.status,
      node.createdAt,
      node.updatedAt,
      node.createdBy,
      node.updatedBy,
    ],
  );
}

async function writeRevision(
  node: KbNode,
  action: string,
  actor: Actor,
  note = "",
): Promise<void> {
  const id = `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  await sql(
    `insert into kb_revisions
      (id, node_id, action, actor_sub, actor_email, actor_name, snapshot, note, created_at)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)`,
    [
      id,
      node.id,
      action,
      actor.sub,
      actor.email,
      actor.name,
      JSON.stringify(node),
      note,
      new Date().toISOString(),
    ],
  );
}

export async function ensureKbSeeded(): Promise<void> {
  if (seeded) return;
  const countRows = await sql<{ count: string }>("select count(*)::text as count from kb_nodes");
  if (Number(countRows[0]?.count ?? 0) > 0) {
    seeded = true;
    await backfillMissingSeedRevisions();
    await ensureProductLines();
    return;
  }

  const now = new Date().toISOString();
  const system: Actor = {
    sub: "system",
    email: "system@quoteops.local",
    name: "System Seed",
    isAdmin: true,
    verified: true,
    role: "admin",
  };

  const folders: KbNode[] = [
    {
      id: "folder-principles",
      parentId: null,
      kind: "folder",
      slug: "principles",
      titleZh: "原则与框架",
      titleEn: "Principles & Frameworks",
      summaryZh: "分类原则、优先检测、六模块与证据链",
      summaryEn: "Classification, priorities, six modules, evidence chains",
      bodyZh: "",
      bodyEn: "",
      sortOrder: 10,
      tags: ["folder", "principles", "cfd-broker"],
      payload: { product: "cfd-broker" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    },
    {
      id: "folder-pipeline",
      parentId: null,
      kind: "folder",
      slug: "pipeline-root",
      titleZh: "定价全流程 LP→PE→MT",
      titleEn: "Pricing Pipeline LP→PE→MT",
      summaryZh: PIPELINE_SUMMARY.principleZh,
      summaryEn: PIPELINE_SUMMARY.principle,
      bodyZh: PIPELINE_SUMMARY.evidenceChainZh,
      bodyEn: PIPELINE_SUMMARY.evidenceChain,
      sortOrder: 20,
      tags: ["folder", "pipeline", "cfd-broker"],
      payload: { product: "cfd-broker" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    },
    {
      id: "folder-risks",
      parentId: null,
      kind: "folder",
      slug: "risks-root",
      titleZh: "风险与套利场景（86）",
      titleEn: "Risk & Arb Scenarios (86)",
      summaryZh: "H/T/A/M 分类目录。Broker 亏钱 ≠ 违规。",
      summaryEn: "H/T/A/M catalog. Broker loss ≠ abuse.",
      bodyZh: "",
      bodyEn: "",
      sortOrder: 30,
      tags: ["folder", "risks", "cfd-broker"],
      payload: { product: "cfd-broker" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    },
    {
      id: "folder-skills",
      parentId: null,
      kind: "folder",
      slug: "skills-root",
      titleZh: "技能库 · RCA Playbooks",
      titleEn: "Skill Library · RCA Playbooks",
      summaryZh: "可交互排查清单与占位 SQL",
      summaryEn: "Interactive checklists and placeholder SQL",
      bodyZh: "",
      bodyEn: "",
      sortOrder: 40,
      tags: ["folder", "skills", "cfd-broker"],
      payload: { product: "cfd-broker" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    },
    {
      id: "folder-data",
      parentId: null,
      kind: "folder",
      slug: "data-root",
      titleZh: "数据库架构与访问",
      titleEn: "Database Architecture & Access",
      summaryZh: ACCESS_PLACEHOLDERS.noteZh,
      summaryEn: ACCESS_PLACEHOLDERS.note,
      bodyZh: `VPN: ${ACCESS_PLACEHOLDERS.vpn}\nBastion: ${ACCESS_PLACEHOLDERS.bastion}\nBI: ${ACCESS_PLACEHOLDERS.bi}\nGrafana: ${ACCESS_PLACEHOLDERS.grafana}`,
      bodyEn: `VPN: ${ACCESS_PLACEHOLDERS.vpn}\nBastion: ${ACCESS_PLACEHOLDERS.bastion}\nBI: ${ACCESS_PLACEHOLDERS.bi}\nGrafana: ${ACCESS_PLACEHOLDERS.grafana}`,
      sortOrder: 50,
      tags: ["folder", "database", "cfd-broker"],
      payload: { access: ACCESS_PLACEHOLDERS, product: "cfd-broker" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    },
    {
      id: "folder-custom",
      parentId: null,
      kind: "folder",
      slug: "custom-root",
      titleZh: "自定义知识",
      titleEn: "Custom Knowledge",
      summaryZh: "管理员新增的知识页面",
      summaryEn: "Admin-authored knowledge pages",
      bodyZh: "",
      bodyEn: "",
      sortOrder: 60,
      tags: ["folder", "custom", "cfd-broker"],
      payload: { product: "cfd-broker" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    },
  ];

  for (const f of folders) await insertNodeRaw(f);

  for (const [i, a] of ARTICLES.entries()) {
    await insertNodeRaw({
      id: `article-${a.id}`,
      parentId: "folder-principles",
      kind: "article",
      slug: a.slug,
      titleZh: a.titleZh,
      titleEn: a.title,
      summaryZh: a.summaryZh,
      summaryEn: a.summary,
      bodyZh: a.bodyZh,
      bodyEn: a.body,
      sortOrder: (i + 1) * 10,
      tags: a.tags,
      payload: { source: "seed-article" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    });
  }

  for (const [i, st] of PIPELINE_STAGES.entries()) {
    await insertNodeRaw({
      id: `pipeline-${st.id}`,
      parentId: "folder-pipeline",
      kind: "pipeline",
      slug: `pipeline-${st.id}`,
      titleZh: st.nameZh,
      titleEn: st.name,
      summaryZh: st.roleZh,
      summaryEn: st.role,
      bodyZh: [
        `## 输入\n${st.inputs.map((x) => `- ${x}`).join("\n")}`,
        `## 输出\n${st.outputs.map((x) => `- ${x}`).join("\n")}`,
        `## 故障模式\n${st.failureModesZh.map((x) => `- ${x}`).join("\n")}`,
        `## 关键检查\n${st.checksZh.map((x) => `- ${x}`).join("\n")}`,
        `## 系统\n${st.systems.map((x) => `- ${x}`).join("\n")}`,
      ].join("\n\n"),
      bodyEn: [
        `## Inputs\n${st.inputs.map((x) => `- ${x}`).join("\n")}`,
        `## Outputs\n${st.outputs.map((x) => `- ${x}`).join("\n")}`,
        `## Failure modes\n${st.failureModes.map((x) => `- ${x}`).join("\n")}`,
        `## Key checks\n${st.checks.map((x) => `- ${x}`).join("\n")}`,
        `## Systems\n${st.systems.map((x) => `- ${x}`).join("\n")}`,
      ].join("\n\n"),
      sortOrder: (i + 1) * 10,
      tags: ["pipeline", st.id],
      payload: { stage: st },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    });
  }

  for (const r of RISK_SCENARIOS) {
    await insertNodeRaw({
      id: `risk-${r.id}`,
      parentId: "folder-risks",
      kind: "risk",
      slug: `risk-${r.id}-${r.slug}`,
      titleZh: `#${r.id} ${r.titleZh}`,
      titleEn: `#${r.id} ${r.title}`,
      summaryZh: r.howItWorksZh,
      summaryEn: r.howItWorks,
      bodyZh: [
        `## 运作方式\n${r.howItWorksZh}`,
        `## 分类\n${r.classes.join(" / ")} · ${r.frequency} · ${r.severity}`,
        `## 如何检测\n${r.detectZh.map((x) => `- ${x}`).join("\n")}`,
        `## 预防或管理\n${r.preventZh.map((x) => `- ${x}`).join("\n")}`,
        `## 负责\n${r.owners.map((x) => `- ${x}`).join("\n")}`,
      ].join("\n\n"),
      bodyEn: [
        `## How it works\n${r.howItWorks}`,
        `## Class\n${r.classes.join(" / ")} · ${r.frequency} · ${r.severity}`,
        `## Detect\n${r.detect.map((x) => `- ${x}`).join("\n")}`,
        `## Prevent\n${r.prevent.map((x) => `- ${x}`).join("\n")}`,
        `## Owners\n${r.owners.map((x) => `- ${x}`).join("\n")}`,
      ].join("\n\n"),
      sortOrder: r.id * 10,
      tags: [...r.tags, r.category, ...r.classes],
      payload: { risk: r },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    });
  }

  for (const [i, s] of SKILLS.entries()) {
    await insertNodeRaw({
      id: s.id,
      parentId: "folder-skills",
      kind: "skill",
      slug: s.slug,
      titleZh: s.titleZh,
      titleEn: s.title,
      summaryZh: s.summaryZh,
      summaryEn: s.summary,
      bodyZh: [
        `## 摘要\n${s.summaryZh}`,
        `## 触发\n${s.triggersZh.map((x) => `- ${x}`).join("\n")}`,
        `## 步骤\n${s.steps.map((st, n) => `### ${n + 1}. ${st.titleZh}\n${st.detailZh}${st.queryHintZh ? `\n\n\`\`\`sql\n${st.queryHintZh}\n\`\`\`` : ""}`).join("\n\n")}`,
        `## 证据\n${s.evidenceZh.map((x) => `- ${x}`).join("\n")}`,
      ].join("\n\n"),
      bodyEn: [
        `## Summary\n${s.summary}`,
        `## Triggers\n${s.triggers.map((x) => `- ${x}`).join("\n")}`,
        `## Steps\n${s.steps.map((st, n) => `### ${n + 1}. ${st.title}\n${st.detail}${st.queryHint ? `\n\n\`\`\`sql\n${st.queryHint}\n\`\`\`` : ""}`).join("\n\n")}`,
        `## Evidence\n${s.evidence.map((x) => `- ${x}`).join("\n")}`,
      ].join("\n\n"),
      sortOrder: (i + 1) * 10,
      tags: s.tags,
      payload: { skill: s },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    });
  }

  for (const [i, d] of DB_SYSTEMS.entries()) {
    await insertNodeRaw({
      id: `db-${d.id}`,
      parentId: "folder-data",
      kind: "database",
      slug: `db-${d.id}`,
      titleZh: d.nameZh,
      titleEn: d.name,
      summaryZh: d.purposeZh,
      summaryEn: d.purpose,
      bodyZh: [
        `## 引擎\n${d.engine}`,
        `## 访问\n- Host: \`${d.hostPlaceholder}\`\n- Port: \`${d.portPlaceholder}\``,
        `## 说明\n${d.schemaNotesZh}`,
        `## 关键表\n${d.keyTables.map((t) => `- **${t.name}** — ${t.descriptionZh}`).join("\n")}`,
        `## 权限\n${d.accessRoles.map((x) => `- ${x}`).join("\n")}`,
        `## Owner\n${d.owner}`,
      ].join("\n\n"),
      bodyEn: [
        `## Engine\n${d.engine}`,
        `## Access\n- Host: \`${d.hostPlaceholder}\`\n- Port: \`${d.portPlaceholder}\``,
        `## Notes\n${d.schemaNotes}`,
        `## Key tables\n${d.keyTables.map((t) => `- **${t.name}** — ${t.description}`).join("\n")}`,
        `## Access roles\n${d.accessRoles.map((x) => `- ${x}`).join("\n")}`,
        `## Owner\n${d.owner}`,
      ].join("\n\n"),
      sortOrder: (i + 1) * 10,
      tags: ["database", d.id],
      payload: { database: d },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    });
  }

  seeded = true;

  // Tag CFD seed + add V Exchange product line.
  await ensureProductLines();

  // Seed audit trail so every page has at least one operator log entry.
  const allSeeded = await sql("select * from kb_nodes");
  for (const row of allSeeded) {
    await writeRevision(rowToNode(row), "seed", system, "initial seed");
  }
}

/**
 * Ensure CFD nodes are tagged product=cfd-broker and V Exchange tree exists.
 * Safe to run repeatedly.
 */
async function ensureProductLines(): Promise<void> {
  const system: Actor = {
    sub: "system",
    email: "system@quoteops.local",
    name: "System Seed",
    isAdmin: true,
    verified: true,
    role: "admin",
  };
  const now = new Date().toISOString();

  // Tag any node missing payload.product as CFD broker (legacy seed).
  const all = await sql("select * from kb_nodes");
  for (const row of all) {
    const n = rowToNode(row);
    if (n.id.startsWith("ve-") || n.id === "folder-v-exchange" || n.slug.startsWith("ve-")) {
      continue;
    }
    if (productOfNode(n.payload, n.tags) === "cfd-broker" && n.payload?.product !== "cfd-broker") {
      const payload = { ...n.payload, product: "cfd-broker" as const };
      const tags = Array.from(new Set([...n.tags, "cfd-broker"]));
      await sql(
        `update kb_nodes set payload=$2::jsonb, tags=$3::jsonb, updated_at=$4 where id=$1`,
        [n.id, JSON.stringify(payload), JSON.stringify(tags), now],
      );
    }
  }

  const existingVe = await sql("select id from kb_nodes where id = $1 limit 1", ["folder-v-exchange"]);
  if (existingVe.length === 0) {
    const root: KbNode = {
      id: "folder-v-exchange",
      parentId: null,
      kind: "folder",
      slug: "v-exchange-perp",
      titleZh: "V Exchange 永续合约",
      titleEn: "V Exchange Perpetual",
      summaryZh: `与 CFD Broker 分离的永续合约风控知识库 · ${VE_META.version} · ${VE_META.date}`,
      summaryEn: `Perp risk KB separate from CFD Broker · ${VE_META.version} · ${VE_META.date}`,
      bodyZh: "产品线：v-exchange-perp。勿与 CFD Broker Pricing 语料混淆。",
      bodyEn: "Product line: v-exchange-perp. Do not mix with CFD Broker Pricing corpus.",
      sortOrder: 200,
      tags: ["v-exchange-perp", "perpetual", "永续"],
      payload: { product: "v-exchange-perp" },
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: system.email,
      updatedBy: system.email,
    };
    await insertNodeRaw(root);
    await writeRevision(root, "seed", system, "v-exchange product root");
  } else {
    await sql(
      `update kb_nodes set summary_zh=$2, summary_en=$3, updated_at=$4, updated_by=$5 where id=$1`,
      [
        "folder-v-exchange",
        `与 CFD Broker 分离的永续合约风控知识库 · ${VE_META.version} · ${VE_META.date}`,
        `Perp risk KB separate from CFD Broker · ${VE_META.version} · ${VE_META.date}`,
        now,
        system.email,
      ],
    );
  }

  // Upsert every VE seed doc so catalog additions (e.g. 138-risk V2.0) land on existing DBs.
  for (const doc of VE_DOCS) {
    const tags = [...doc.tags, "v-exchange-perp", "perpetual", "永续"];
    const payload = {
      product: "v-exchange-perp" as const,
      version: VE_META.version,
      contract: VE_META.contract,
    };
    const existing = await sql("select id, payload from kb_nodes where id = $1 limit 1", [doc.id]);
    if (existing.length === 0) {
      const node: KbNode = {
        id: doc.id,
        parentId: "folder-v-exchange",
        kind: doc.kind ?? "article",
        slug: doc.slug,
        titleZh: doc.titleZh,
        titleEn: doc.titleEn,
        summaryZh: doc.summaryZh,
        summaryEn: doc.summaryEn,
        bodyZh: doc.bodyZh,
        bodyEn: doc.bodyEn,
        sortOrder: doc.sortOrder,
        tags,
        payload,
        status: "published",
        createdAt: now,
        updatedAt: now,
        createdBy: system.email,
        updatedBy: system.email,
      };
      await insertNodeRaw(node);
      await writeRevision(node, "seed", system, "v-exchange seed");
      continue;
    }
    const prev = rowToNode(existing[0]!);
    const prevVer = String(prev.payload?.version ?? "");
    if (prevVer === VE_META.version && prev.bodyZh === doc.bodyZh) continue;
    await sql(
      `update kb_nodes set
        parent_id=$2, kind=$3, slug=$4, title_zh=$5, title_en=$6,
        summary_zh=$7, summary_en=$8, body_zh=$9, body_en=$10,
        sort_order=$11, tags=$12::jsonb, payload=$13::jsonb, status=$14,
        updated_at=$15, updated_by=$16
       where id=$1`,
      [
        doc.id,
        "folder-v-exchange",
        doc.kind ?? "article",
        doc.slug,
        doc.titleZh,
        doc.titleEn,
        doc.summaryZh,
        doc.summaryEn,
        doc.bodyZh,
        doc.bodyEn,
        doc.sortOrder,
        JSON.stringify(tags),
        JSON.stringify(payload),
        "published",
        now,
        system.email,
      ],
    );
    const updated = rowToNode(
      (await sql("select * from kb_nodes where id = $1", [doc.id]))[0]!,
    );
    await writeRevision(updated, "update", system, `v-exchange seed upsert ${VE_META.version}`);
  }
}

/** Backfill seed revisions for DBs that were seeded before audit logging. */
async function backfillMissingSeedRevisions(): Promise<void> {
  const missing = await sql(
    `select n.* from kb_nodes n
     left join kb_revisions r on r.node_id = n.id
     where r.id is null
     limit 500`,
  );
  if (missing.length === 0) return;
  const system: Actor = {
    sub: "system",
    email: "system@quoteops.local",
    name: "System Seed",
    isAdmin: true,
    verified: true,
    role: "admin",
  };
  for (const row of missing) {
    await writeRevision(rowToNode(row), "seed", system, "backfill seed revision");
  }
}

export async function listNodes(opts?: {
  kind?: KbKind;
  status?: string;
  q?: string;
  product?: ProductId;
  sort?: "updated" | "created" | "title" | "sort";
  order?: "asc" | "desc";
}): Promise<KbNode[]> {
  await ensureKbSeeded();
  const rows = await sql("select * from kb_nodes");
  let nodes = rows.map((r) => rowToNode(r));
  if (opts?.kind) nodes = nodes.filter((n) => n.kind === opts.kind);
  if (opts?.status) nodes = nodes.filter((n) => n.status === opts.status);
  if (opts?.product) {
    nodes = nodes.filter((n) => productOfNode(n.payload, n.tags) === opts.product);
  }
  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    nodes = nodes.filter((n) =>
      [n.titleZh, n.titleEn, n.summaryZh, n.summaryEn, n.bodyZh, n.bodyEn, ...n.tags, n.slug]
        .join("\n")
        .toLowerCase()
        .includes(q),
    );
  }
  const sort = opts?.sort ?? "sort";
  const dir = opts?.order === "desc" ? -1 : 1;
  nodes.sort((a, b) => {
    if (sort === "updated") return a.updatedAt < b.updatedAt ? -dir : dir;
    if (sort === "created") return a.createdAt < b.createdAt ? -dir : dir;
    if (sort === "title") return a.titleZh.localeCompare(b.titleZh, "zh") * dir;
    return (a.sortOrder - b.sortOrder || a.titleZh.localeCompare(b.titleZh, "zh")) * dir;
  });
  return nodes;
}

export async function getNode(idOrSlug: string): Promise<KbNode | null> {
  await ensureKbSeeded();
  const rows = await sql(
    "select * from kb_nodes where id = $1 or slug = $1 limit 1",
    [idOrSlug],
  );
  return rows[0] ? rowToNode(rows[0]) : null;
}

export async function getTree(product?: ProductId): Promise<TreeNode[]> {
  const nodes = await listNodes({ sort: "sort", order: "asc", product });
  const map = new Map<string, TreeNode>();
  for (const n of nodes) map.set(n.id, { ...n, children: [] });
  const roots: TreeNode[] = [];
  for (const n of map.values()) {
    if (n.parentId && map.has(n.parentId)) map.get(n.parentId)!.children.push(n);
    else roots.push(n);
  }
  return roots;
}

function withBilingualIfPublished(
  fields: {
    titleZh: string;
    titleEn: string;
    summaryZh: string;
    summaryEn: string;
    bodyZh: string;
    bodyEn: string;
    status: KbNode["status"];
    payload: Record<string, unknown>;
  },
): typeof fields {
  if (fields.status !== "published") return fields;
  const m = mirrorMissingLocale(fields);
  return {
    ...fields,
    titleZh: m.titleZh,
    titleEn: m.titleEn,
    summaryZh: m.summaryZh,
    summaryEn: m.summaryEn,
    bodyZh: m.bodyZh,
    bodyEn: m.bodyEn,
    payload: {
      ...fields.payload,
      bilingual: {
        mirroredAt: new Date().toISOString(),
        mirrored: m.mirrored,
        source: m.source,
        needsReview: m.needsReview,
      },
    },
  };
}

export async function createNode(input: KbNodeInput, actor: Actor): Promise<KbNode> {
  await ensureKbSeeded();
  const now = new Date().toISOString();
  const id = input.id || `kb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const slug = await uniqueSlug(input.slug?.trim() || slugify(input.titleEn || input.titleZh || id));
  const bilingual = withBilingualIfPublished({
    titleZh: (input.titleZh ?? "").trim(),
    titleEn: (input.titleEn ?? "").trim(),
    summaryZh: input.summaryZh ?? "",
    summaryEn: input.summaryEn ?? "",
    bodyZh: input.bodyZh ?? "",
    bodyEn: input.bodyEn ?? "",
    status: input.status ?? "draft",
    payload: input.payload ?? {},
  });
  const node: KbNode = {
    id,
    parentId: input.parentId ?? "folder-custom",
    kind: input.kind,
    slug,
    titleZh: bilingual.titleZh,
    titleEn: bilingual.titleEn,
    summaryZh: bilingual.summaryZh,
    summaryEn: bilingual.summaryEn,
    bodyZh: bilingual.bodyZh,
    bodyEn: bilingual.bodyEn,
    sortOrder: input.sortOrder ?? 1000,
    tags: input.tags ?? [],
    payload: bilingual.payload,
    status: bilingual.status,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.email || actor.name,
    updatedBy: actor.email || actor.name,
  };
  await insertNodeRaw(node);
  // insertNodeRaw uses on conflict do nothing — for new ids always inserts.
  // Re-upsert to allow updates via same path if needed:
  await sql(
    `update kb_nodes set
      parent_id=$2, kind=$3, slug=$4, title_zh=$5, title_en=$6, summary_zh=$7, summary_en=$8,
      body_zh=$9, body_en=$10, sort_order=$11, tags=$12::jsonb, payload=$13::jsonb, status=$14,
      updated_at=$15, updated_by=$16
     where id=$1`,
    [
      node.id,
      node.parentId,
      node.kind,
      node.slug,
      node.titleZh,
      node.titleEn,
      node.summaryZh,
      node.summaryEn,
      node.bodyZh,
      node.bodyEn,
      node.sortOrder,
      JSON.stringify(node.tags),
      JSON.stringify(node.payload),
      node.status,
      node.updatedAt,
      node.updatedBy,
    ],
  );
  await writeRevision(node, "create", actor, input.note ?? "");
  return node;
}

export async function updateNode(
  id: string,
  patch: Partial<KbNodeInput>,
  actor: Actor,
): Promise<KbNode | null> {
  const existing = await getNode(id);
  if (!existing) return null;
  const slug =
    patch.slug != null
      ? await uniqueSlug(patch.slug.trim() || existing.slug, existing.id)
      : existing.slug;
  const merged = {
    titleZh: patch.titleZh?.trim() ?? existing.titleZh,
    titleEn: patch.titleEn !== undefined ? patch.titleEn.trim() : existing.titleEn,
    summaryZh: patch.summaryZh ?? existing.summaryZh,
    summaryEn: patch.summaryEn ?? existing.summaryEn,
    bodyZh: patch.bodyZh ?? existing.bodyZh,
    bodyEn: patch.bodyEn ?? existing.bodyEn,
    status: patch.status ?? existing.status,
    payload: patch.payload
      ? { ...existing.payload, ...patch.payload }
      : existing.payload,
  };
  const bilingual = withBilingualIfPublished(merged);
  const next: KbNode = {
    ...existing,
    parentId: patch.parentId !== undefined ? patch.parentId : existing.parentId,
    kind: patch.kind ?? existing.kind,
    slug,
    titleZh: bilingual.titleZh,
    titleEn: bilingual.titleEn,
    summaryZh: bilingual.summaryZh,
    summaryEn: bilingual.summaryEn,
    bodyZh: bilingual.bodyZh,
    bodyEn: bilingual.bodyEn,
    sortOrder: patch.sortOrder ?? existing.sortOrder,
    tags: patch.tags ?? existing.tags,
    payload: bilingual.payload,
    status: bilingual.status,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.email || actor.name,
  };
  await sql(
    `update kb_nodes set
      parent_id=$2, kind=$3, slug=$4, title_zh=$5, title_en=$6, summary_zh=$7, summary_en=$8,
      body_zh=$9, body_en=$10, sort_order=$11, tags=$12::jsonb, payload=$13::jsonb, status=$14,
      updated_at=$15, updated_by=$16
     where id=$1`,
    [
      next.id,
      next.parentId,
      next.kind,
      next.slug,
      next.titleZh,
      next.titleEn,
      next.summaryZh,
      next.summaryEn,
      next.bodyZh,
      next.bodyEn,
      next.sortOrder,
      JSON.stringify(next.tags),
      JSON.stringify(next.payload),
      next.status,
      next.updatedAt,
      next.updatedBy,
    ],
  );
  await writeRevision(next, "update", actor, patch.note ?? "");
  return next;
}

export async function appendToNode(
  id: string,
  blockZh: string,
  blockEn: string,
  actor: Actor,
): Promise<KbNode | null> {
  const existing = await getNode(id);
  if (!existing) return null;
  return updateNode(
    id,
    {
      bodyZh: `${existing.bodyZh.trim()}\n\n${blockZh.trim()}`.trim(),
      bodyEn: `${existing.bodyEn.trim()}\n\n${blockEn.trim()}`.trim(),
      note: "append",
    },
    actor,
  );
}

export async function deleteNode(id: string, actor: Actor): Promise<boolean> {
  const existing = await getNode(id);
  if (!existing) return false;
  if (existing.kind === "folder" && existing.id.startsWith("folder-") && !existing.id.includes("custom")) {
    // Allow delete only if no children — still allow for admin but protect seed roots by requiring empty
    const kids = await sql<{ c: string }>(
      "select count(*)::text as c from kb_nodes where parent_id = $1",
      [id],
    );
    if (Number(kids[0]?.c ?? 0) > 0) {
      throw new Error("folder_not_empty");
    }
  }
  await writeRevision(existing, "delete", actor, "");
  await sql("delete from kb_nodes where id = $1", [id]);
  return true;
}

export async function listRevisions(nodeId: string): Promise<KbRevision[]> {
  await ensureKbSeeded();
  const rows = await sql(
    "select * from kb_revisions where node_id = $1 order by created_at desc limit 100",
    [nodeId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    nodeId: String(row.node_id),
    action: String(row.action),
    actorSub: String(row.actor_sub ?? ""),
    actorEmail: String(row.actor_email ?? ""),
    actorName: String(row.actor_name ?? ""),
    snapshot: parseJson(row.snapshot, {}),
    note: String(row.note ?? ""),
    createdAt: toIso(row.created_at),
  }));
}

export async function addMedia(input: {
  nodeId?: string | null;
  name: string;
  mime: string;
  dataUrl: string;
  actor: Actor;
}): Promise<KbMedia> {
  const id = `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const kind = input.mime.startsWith("image/")
    ? "image"
    : input.mime.startsWith("video/")
      ? "video"
      : "file";
  const sizeBytes = Math.ceil((input.dataUrl.length * 3) / 4);
  if (sizeBytes > 2_500_000) throw new Error("file_too_large");
  const now = new Date().toISOString();
  await sql(
    `insert into kb_media (id, node_id, name, mime, kind, data_url, size_bytes, created_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      input.nodeId ?? null,
      input.name,
      input.mime,
      kind,
      input.dataUrl,
      sizeBytes,
      now,
      input.actor.email || input.actor.name,
    ],
  );
  return {
    id,
    nodeId: input.nodeId ?? null,
    name: input.name,
    mime: input.mime,
    kind,
    dataUrl: input.dataUrl,
    sizeBytes,
    createdAt: now,
    createdBy: input.actor.email || input.actor.name,
  };
}

export async function listMedia(nodeId: string): Promise<KbMedia[]> {
  const rows = await sql(
    "select * from kb_media where node_id = $1 order by created_at desc",
    [nodeId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    nodeId: row.node_id == null ? null : String(row.node_id),
    name: String(row.name),
    mime: String(row.mime),
    kind: String(row.kind),
    dataUrl: String(row.data_url),
    sizeBytes: Number(row.size_bytes ?? 0),
    createdAt: toIso(row.created_at),
    createdBy: String(row.created_by ?? ""),
  }));
}

/** Heuristic AI insert suggestion based on title/tags/body overlap with existing architecture. */
export function suggestInsert(nodes: KbNode[], draft: {
  titleZh: string;
  titleEn?: string;
  bodyZh?: string;
  tags?: string[];
  kind?: KbKind;
}): {
  parentId: string;
  parentTitle: string;
  score: number;
  reasonZh: string;
  reasonEn: string;
  beforeTitle: string;
  afterTitle: string;
}[] {
  const folders = nodes.filter((n) => n.kind === "folder");
  const text = [draft.titleZh, draft.titleEn, draft.bodyZh, ...(draft.tags ?? [])]
    .join(" ")
    .toLowerCase();
  const scored = folders.map((f) => {
    let score = 0;
    const hay = [f.titleZh, f.titleEn, f.summaryZh, ...f.tags].join(" ").toLowerCase();
    for (const token of text.split(/\s+/).filter((t) => t.length > 1).slice(0, 40)) {
      if (hay.includes(token)) score += 2;
    }
    if (draft.kind === "risk" && f.id === "folder-risks") score += 8;
    if (draft.kind === "skill" && f.id === "folder-skills") score += 8;
    if (draft.kind === "pipeline" && f.id === "folder-pipeline") score += 8;
    if (draft.kind === "database" && f.id === "folder-data") score += 8;
    if (draft.kind === "article" && f.id === "folder-principles") score += 6;
    if (draft.kind === "custom" && f.id === "folder-custom") score += 4;
    if (/旧价|stale|latency|markout|报价|lp|pe|mt|套利/.test(text) && f.id === "folder-pipeline")
      score += 3;
    if (/旧价|stale|latency|markout|套利|攻击|abuse/.test(text) && f.id === "folder-risks") score += 3;
    if (/rca|排查|skill|playbook/.test(text) && f.id === "folder-skills") score += 3;
    if (/数据库|database|host|clickhouse|访问/.test(text) && f.id === "folder-data") score += 3;

    const siblings = nodes
      .filter((n) => n.parentId === f.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.titleZh.localeCompare(b.titleZh, "zh"));
    const mid = Math.max(0, Math.floor(siblings.length / 2));
    const before = siblings[mid - 1];
    const after = siblings[mid];
    return {
      parentId: f.id,
      parentTitle: f.titleZh,
      score,
      reasonZh: `与「${f.titleZh}」主题/标签重合度 ${score}`,
      reasonEn: `Overlap score ${score} with “${f.titleEn || f.titleZh}”`,
      beforeTitle: before?.titleZh ?? "（将成为该分类下首条）",
      afterTitle: after?.titleZh ?? "（将成为该分类下末条）",
    };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function nodeToMarkdown(node: KbNode, locale: "zh-CN" | "en" = "zh-CN"): string {
  const title = locale === "zh-CN" ? node.titleZh : node.titleEn || node.titleZh;
  const summary = locale === "zh-CN" ? node.summaryZh : node.summaryEn || node.summaryZh;
  const body = locale === "zh-CN" ? node.bodyZh : node.bodyEn || node.bodyZh;
  return [
    `# ${title}`,
    "",
    `> ${summary}`,
    "",
    `- kind: \`${node.kind}\``,
    `- slug: \`${node.slug}\``,
    `- status: \`${node.status}\``,
    `- tags: ${node.tags.join(", ") || "—"}`,
    `- created: ${node.createdAt}`,
    `- updated: ${node.updatedAt}`,
    `- created_by: ${node.createdBy}`,
    `- updated_by: ${node.updatedBy}`,
    "",
    "---",
    "",
    body,
    "",
  ].join("\n");
}

/** On publish: fill empty counterpart language (ZH↔EN) with glossary-assisted draft + review flag. */
export async function publishNode(id: string, actor: Actor): Promise<KbNode | null> {
  const node = await getNode(id);
  if (!node) return null;
  return updateNode(
    id,
    {
      titleZh: node.titleZh,
      titleEn: node.titleEn,
      summaryZh: node.summaryZh,
      summaryEn: node.summaryEn,
      bodyZh: node.bodyZh,
      bodyEn: node.bodyEn,
      status: "published",
      note: "publish+bilingual-mirror",
      payload: node.payload,
    },
    actor,
  );
}
