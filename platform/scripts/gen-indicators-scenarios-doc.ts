/**
 * Emit full Admin/Pricing/Dealing indicators + scenarios markdown (EN + zh-Hant).
 */
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });
process.env.CRMP_DB_PATH = process.env.CRMP_DB_PATH || path.join(dataDir, "vantage_risk.db");

async function main() {
  const { getDb } = await import("../src/lib/db");
  getDb();
  const {
    listIndicatorCatalog,
    listScenarioCatalog,
    listSkillScenarioSummary,
    listLinkedScenarioSummary,
    forexDemoPack,
  } = await import("../src/lib/docs/indicators-scenarios");

  const indicators = listIndicatorCatalog();
  const scenarios = listScenarioCatalog();
  const skills = listSkillScenarioSummary();
  const linked = listLinkedScenarioSummary();
  const forex = forexDemoPack();

  const byBu = (bu: "admin" | "pricing" | "dealing" | "shared" | "all") =>
    indicators.filter((r) => {
      if (bu === "all") return true;
      if (bu === "admin") return true;
      if (bu === "pricing") return r.owner_bu === "pricing" || r.owner_bu === "shared" || r.in_forex_demo;
      if (bu === "dealing") return r.owner_bu === "dealing" || r.owner_bu === "shared" || r.in_forex_demo;
      return r.owner_bu === bu;
    });

  const scByAudience = (aud: "admin" | "pricing" | "dealing") =>
    scenarios.filter((s) => s.audience.includes(aud));

  function indTableEn(rows: typeof indicators) {
    const lines = [
      "| Monitor ID | Name | Domain | Product | Owner BU | Warn | Breach | Unit | Forex demo |",
      "|------------|------|--------|---------|----------|------|--------|------|------------|",
    ];
    for (const r of rows) {
      lines.push(
        `| \`${r.monitor_id}\` | ${r.name.replace(/\|/g, "/")} | ${r.domain_code} | ${r.product} | ${r.owner_bu} | ${r.threshold_warn ?? "—"} | ${r.threshold_breach ?? "—"} | ${r.unit ?? "—"} | ${r.in_forex_demo ? "yes" : ""} |`
      );
    }
    return lines.join("\n");
  }

  function indTableZh(rows: typeof indicators) {
    const buZh: Record<string, string> = {
      admin: "管理",
      pricing: "定價",
      dealing: "交易",
      shared: "共用",
    };
    const lines = [
      "| 指標 ID | 名稱 | 領域 | 產品 | 負責 BU | 警告 | 違規 | 單位 | 外匯示範 |",
      "|---------|------|------|------|---------|------|------|------|----------|",
    ];
    for (const r of rows) {
      lines.push(
        `| \`${r.monitor_id}\` | ${r.name.replace(/\|/g, "/")} | ${r.domain_code} | ${r.product} | ${buZh[r.owner_bu] || r.owner_bu} | ${r.threshold_warn ?? "—"} | ${r.threshold_breach ?? "—"} | ${r.unit ?? "—"} | ${r.in_forex_demo ? "是" : ""} |`
      );
    }
    return lines.join("\n");
  }

  function scTableEn(rows: typeof scenarios) {
    const lines = [
      "| Code | Name | Domain | Priority | Product | Primary indicators | Audience |",
      "|------|------|--------|----------|---------|--------------------|----------|",
    ];
    for (const s of rows) {
      lines.push(
        `| \`${s.code}\` | ${s.name_en.replace(/\|/g, "/")} | ${s.domain_code} | P${s.priority} | ${s.product} | ${s.primary_indicators.map((x) => `\`${x}\``).join(", ") || "—"} | ${s.audience.join(", ")} |`
      );
    }
    return lines.join("\n");
  }

  function scTableZh(rows: typeof scenarios) {
    const lines = [
      "| 代碼 | 名稱 | 領域 | 優先 | 產品 | 主要指標 | 受眾 |",
      "|------|------|------|------|------|----------|------|",
    ];
    const audZh: Record<string, string> = { admin: "管理", pricing: "定價", dealing: "交易" };
    for (const s of rows) {
      lines.push(
        `| \`${s.code}\` | ${s.name_zh.replace(/\|/g, "/")} | ${s.domain_code} | P${s.priority} | ${s.product} | ${s.primary_indicators.map((x) => `\`${x}\``).join(", ") || "—"} | ${s.audience.map((a) => audZh[a] || a).join("、")} |`
      );
    }
    return lines.join("\n");
  }

  function skillTableEn() {
    const lines = [
      "| Skill code | Name | Primary monitor | Related | Owner dept |",
      "|------------|------|-----------------|---------|------------|",
    ];
    for (const s of skills) {
      lines.push(
        `| \`${s.code}\` | ${String(s.name).replace(/\|/g, "/")} | \`${s.monitor_id}\` | ${(s.related || []).map((x: string) => `\`${x}\``).join(", ") || "—"} | ${s.owner_department} |`
      );
    }
    return lines.join("\n");
  }

  function skillTableZh() {
    const lines = [
      "| 技能代碼 | 名稱 | 主指標 | 相關 | 負責部門 |",
      "|----------|------|--------|------|----------|",
    ];
    for (const s of skills) {
      lines.push(
        `| \`${s.code}\` | ${String(s.name).replace(/\|/g, "/")} | \`${s.monitor_id}\` | ${(s.related || []).map((x: string) => `\`${x}\``).join(", ") || "—"} | ${s.owner_department} |`
      );
    }
    return lines.join("\n");
  }

  function linkedTableEn() {
    const lines = ["| Code | Name | Monitors |", "|------|------|----------|"];
    for (const s of linked) {
      lines.push(
        `| \`${s.code}\` | ${String(s.name).replace(/\|/g, "/")} | ${(s.monitors || []).map((x: string) => `\`${x}\``).join(", ") || "—"} |`
      );
    }
    return lines.join("\n");
  }

  function linkedTableZh() {
    const lines = ["| 代碼 | 名稱 | 指標 |", "|------|------|------|"];
    for (const s of linked) {
      lines.push(
        `| \`${s.code}\` | ${String(s.name).replace(/\|/g, "/")} | ${(s.monitors || []).map((x: string) => `\`${x}\``).join(", ") || "—"} |`
      );
    }
    return lines.join("\n");
  }

  const pricingInd = byBu("pricing");
  const dealingInd = byBu("dealing");
  const adminInd = indicators; // full set for admin
  const generated = new Date().toISOString().slice(0, 10);

  const en = `# Indicators & Risk Scenarios

Full operator catalogue for **Admin**, **Pricing**, and **Dealing** desks.

| Surface | Path |
|---------|------|
| Interactive board (filter by BU) | \`/admin/docs/indicators-scenarios\` |
| Seed SQL explorer | \`/admin/docs/simulated-data\` |
| Monitor 2.0 live registry | \`/admin/monitor-2\` |
| Domain scenario map | \`/admin/risk-domains\` |
| Skill playbooks | \`/admin/skills\` |

Generated from live SQLite \`monitor_indicators\` + domain/skill catalogs (${generated}). Counts: **${indicators.length}** indicators · **${scenarios.length}** domain scenarios · **${skills.length}** skills · **${linked.length}** linked timelines.

## Audience map

| Desk | Owns | Typical domains | How to use this doc |
|------|------|-----------------|---------------------|
| **Admin / Risk Owner** | Policy, L2 approve, discovery promote, severity weights | Credit / client, model & AI, fraud, infra | Full indicator + scenario lists below |
| **Pricing** | Quote age, publish lag, product exposure, feed propagation | Market pricing, product config | § Pricing indicators & scenarios |
| **Dealing / LP** | Reject rate, hedge coverage, A-book tilt, weekend metals | LP & hedge, credit contagion companions | § Dealing indicators & scenarios |

## Canonical forex CFD use-case — ${forex.incident_id}

| Field | Value |
|-------|--------|
| Incident | \`${forex.incident_id}\` |
| LP / symbol | ${forex.lp} · ${forex.symbol} |
| Severity | ${forex.severity} ${forex.severity_label} |
| Desk | ${forex.desk} |
| Chain | \`${forex.chain_code}\` |
| Seed monitors | ${(forex.monitors || []).map((m: string) => `\`${m}\``).join(", ")} |

### Companion cases

| Id | Story | Monitors |
|----|--------|----------|
${(forex.companions || [])
  .map(
    (c: { id: string; title_en: string; monitors: string[] }) =>
      `| ${c.id} | ${c.title_en} | ${c.monitors.map((m) => `\`${m}\``).join(", ")} |`
  )
  .join("\n")}

## All indicators (${indicators.length})

${indTableEn(adminInd)}

### Pricing lens (${pricingInd.length})

Indicators owned by Pricing, shared domains, or on the INC-1028 forex demo book.

${indTableEn(pricingInd)}

### Dealing lens (${dealingInd.length})

Indicators owned by Dealing / LP, shared domains, or on the INC-1028 forex demo book.

${indTableEn(dealingInd)}

## Domain scenarios (${scenarios.length})

${scTableEn(scenarios)}

### Admin audience (${scByAudience("admin").length})

${scTableEn(scByAudience("admin"))}

### Pricing audience (${scByAudience("pricing").length})

${scTableEn(scByAudience("pricing"))}

### Dealing audience (${scByAudience("dealing").length})

${scTableEn(scByAudience("dealing"))}

## Skill playbooks (${skills.length})

${skillTableEn()}

## Linked scenario timelines (${linked.length})

${linkedTableEn()}

## Where the lists come from

| Layer | Source |
|-------|--------|
| Indicators | SQLite \`monitor_indicators\` (+ \`monitor-indicator-meta\`) |
| Domain scenarios | \`lib/ai/risk-domain-scenarios.ts\` |
| Skill playbooks | \`lib/ai/risk-scenarios-catalog.ts\` → \`/admin/skills\` |
| Linked timelines | same catalog → Knowledge Tree |
| Forex pack | \`lib/demo/forex-incident-1028.ts\` |

## AI / LLM (real thinking each trigger)

| Trigger | Behaviour when \`OPENAI_API_KEY\` set (\`CRMP_AI_LLM\` not off) |
|---------|-------------------------------------------------------------|
| Discovery **Scan Now** | Stat/ML on live SQLite window; unique \`scan_seed\` + thinking trail |
| Discovery **Analyse** | Auto LIVE OpenAI; fresh \`ANL-*\` thinking each call |
| Alert **AI RCA** | Heuristic first, then OpenAI rewrite with thinking evidence |
| Run detectors / Monitor run | New analyses LLM-enriched after the batch |
| Home **dummy spine** | Enrich after RCA when keyed |
| Desk selection chat | Heuristic grounded reply, then OpenAI rewrite |

Failures fall back to heuristic / MOCK — they never block the desk.
`;

  const zh = `# 指標與風險情境

供 **管理（Admin）**、**定價（Pricing）**、**交易／Dealing** 台面使用的完整目錄。

| 介面 | 路徑 |
|------|------|
| 互動看板（可依 BU 篩選） | \`/admin/docs/indicators-scenarios\` |
| 種子 SQL 瀏覽 | \`/admin/docs/simulated-data\` |
| Monitor 2.0 即時登錄 | \`/admin/monitor-2\` |
| 領域情境圖 | \`/admin/risk-domains\` |
| 技能劇本 | \`/admin/skills\` |

由即時 SQLite \`monitor_indicators\` 與領域／技能目錄產生（${generated}）。數量：**${indicators.length}** 項指標 · **${scenarios.length}** 項領域情境 · **${skills.length}** 項技能 · **${linked.length}** 條連結時間鏈。

## 受眾對照

| 台面 | 負責 | 典型領域 | 本文用法 |
|------|------|----------|----------|
| **管理／風險負責人** | 政策、L2 核准、探索晉升、嚴重度權重 | 信用／客戶、模型與 AI、詐欺、基礎建設 | 下方完整指標與情境清單 |
| **定價** | 報價年齡、發布延遲、商品曝險、行情傳播 | 市場定價、商品設定 | 「定價視角」章節 |
| **交易／LP** | 拒絕率、對沖覆蓋、A-book 傾斜、週末金屬 | LP 與對沖、信用傳染伴隨 | 「交易視角」章節 |

## 標準外匯 CFD 用例 — ${forex.incident_id}

| 欄位 | 值 |
|------|-----|
| 事故 | \`${forex.incident_id}\` |
| LP／商品 | ${forex.lp} · ${forex.symbol} |
| 嚴重度 | ${forex.severity} ${forex.severity_label} |
| 台面 | ${forex.desk} |
| 鏈碼 | \`${forex.chain_code}\` |
| 種子指標 | ${(forex.monitors || []).map((m: string) => `\`${m}\``).join("、")} |

### 伴隨案例

| Id | 故事 | 指標 |
|----|------|------|
${(forex.companions || [])
  .map(
    (c: { id: string; title_zh: string; monitors: string[] }) =>
      `| ${c.id} | ${c.title_zh} | ${c.monitors.map((m) => `\`${m}\``).join("、")} |`
  )
  .join("\n")}

## 全部指標（${indicators.length}）

${indTableZh(adminInd)}

### 定價視角（${pricingInd.length}）

定價負責、共用領域，或落在 INC-1028 外匯示範帳簿的指標。

${indTableZh(pricingInd)}

### 交易視角（${dealingInd.length}）

交易／LP 負責、共用領域，或落在 INC-1028 外匯示範帳簿的指標。

${indTableZh(dealingInd)}

## 領域情境（${scenarios.length}）

${scTableZh(scenarios)}

### 管理受眾（${scByAudience("admin").length}）

${scTableZh(scByAudience("admin"))}

### 定價受眾（${scByAudience("pricing").length}）

${scTableZh(scByAudience("pricing"))}

### 交易受眾（${scByAudience("dealing").length}）

${scTableZh(scByAudience("dealing"))}

## 技能劇本（${skills.length}）

${skillTableZh()}

## 連結情境時間鏈（${linked.length}）

${linkedTableZh()}

## 清單來源

| 層級 | 來源 |
|------|------|
| 指標 | SQLite \`monitor_indicators\`（＋\`monitor-indicator-meta\`） |
| 領域情境 | \`lib/ai/risk-domain-scenarios.ts\` |
| 技能劇本 | \`lib/ai/risk-scenarios-catalog.ts\` → \`/admin/skills\` |
| 連結時間鏈 | 同上目錄 → 知識樹 |
| 外匯組合 | \`lib/demo/forex-incident-1028.ts\` |

## AI／LLM（每次觸發真實思考）

| 觸發 | 設定 \`OPENAI_API_KEY\` 且 \`CRMP_AI_LLM\` 未關閉時的行為 |
|------|------------------------------------------------------|
| 探索 **立即掃描** | 在即時 SQLite 視窗跑統計／ML；唯一 \`scan_seed\`＋思考軌跡 |
| 探索 **分析** | 自動 LIVE OpenAI；每次呼叫新的 \`ANL-*\` 思考 |
| 警報 **AI 根因** | 先啟發式，再 OpenAI 改寫並寫入思考證據 |
| 執行偵測器／Monitor 執行 | 批次後對新分析做 LLM 強化 |
| 首頁 **虛擬脊柱** | 有金鑰時在 RCA 後強化 |
| 台面選取聊天 | 啟發式回覆後再經 OpenAI 改寫 |

失敗一律回退啟發式／MOCK，不阻斷台面作業。
`;

  const docs = path.resolve(__dirname, "../docs");
  fs.writeFileSync(path.join(docs, "INDICATORS_SCENARIOS.md"), en);
  fs.writeFileSync(path.join(docs, "INDICATORS_SCENARIOS.zh-Hant.md"), zh);
  console.log(
    JSON.stringify(
      {
        ok: true,
        indicators: indicators.length,
        scenarios: scenarios.length,
        skills: skills.length,
        linked: linked.length,
        pricing_indicators: pricingInd.length,
        dealing_indicators: dealingInd.length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
