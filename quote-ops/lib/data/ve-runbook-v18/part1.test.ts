import { describe, expect, it } from "vitest";
import { VE_DOCS, VE_META } from "@/lib/data/vexchange";
import {
  RUNBOOK_V18_INGESTED_PARTS,
  RUNBOOK_V18_PENDING_PARTS,
  VE_RUNBOOK_SKILLS,
  buildVeRunbookV18Docs,
} from "@/lib/data/ve-runbook-v18";
import { getSkill, skillsForProduct } from "@/lib/data/skills";

describe("Runbook V18 part 1 skills", () => {
  it("registers parts 1–2 and leaves 3–4 pending", () => {
    expect(RUNBOOK_V18_INGESTED_PARTS).toEqual([1, 2]);
    expect(RUNBOOK_V18_PENDING_PARTS).toEqual([3, 4]);
  });

  it("builds overview + combined L1 books + per-L1 skill docs with tables", () => {
    const docs = buildVeRunbookV18Docs();
    // overview + book01-06 + 6 per-L1 + pricing07-15 + 9 per-L1 = 1+1+6+1+9 = 18
    expect(docs).toHaveLength(18);
    expect(docs.every((d) => d.kind === "skill")).toBe(true);

    const overview = docs.find((d) => d.id === "ve-skill-runbook-v18-overview");
    expect(overview?.bodyZh).toContain("| 后管中文页面 | 可用于排查的原型字段 |");
    expect(overview?.bodyZh).toContain("市场行情源管理");
    expect(overview?.bodyZh).toContain("告警统一从 **Lark** 接收");

    const book = docs.find((d) => d.id === "ve-skill-runbook-v18-l1-01-06");
    expect(book?.bodyZh).toContain("| 步骤 | 执行人 | 具体排查操作 | 判断条件、分支与处理 |");
    expect(book?.bodyZh.match(/\| 步骤 \| 执行人 \|/g)?.length).toBe(6);
    expect(book?.bodyZh).toContain("L1-01｜无交易监控");
    expect(book?.bodyZh).toContain("L1-06｜限价异常");
    expect(book?.bodyZh).toContain("跳转L2-C");
    expect(book?.bodyZh).toContain("【可选】");

    const pricing = docs.find((d) => d.id === "ve-skill-runbook-v18-l1-07-15");
    expect(pricing?.bodyZh.match(/\| 步骤 \| 执行人 \|/g)?.length).toBe(9);
    expect(pricing?.bodyZh).toContain("L1-07｜平台内部价格偏差监控");
    expect(pricing?.bodyZh).toContain("L1-15｜指数市场异常：仅剩单一有效源");
    expect(pricing?.bodyZh).toContain("跳转L2-A");
    expect(pricing?.bodyZh).toContain("OKEX_INDEX");

    const l101 = docs.find((d) => d.slug === "ve-l1-01-no-trade");
    expect(l101?.bodyZh).toContain("| 步骤 | 执行人 |");
    expect(l101?.bodyZh).toContain("连续40秒无交易");

    const l113 = docs.find((d) => d.slug === "ve-l1-13-index-source-switch");
    expect(l113?.bodyZh).toContain("| 步骤 | 执行人 |");
    expect(l113?.bodyZh).toContain("线性过渡");
  });

  it("is included in VE_DOCS and bumps seed version", () => {
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l1-01-06")).toBe(true);
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l1-07-15")).toBe(true);
    expect(VE_META.version).toBe("V2.2");
  });

  it("exposes interactive skills on VE product only", () => {
    // overview + L1-01..06 + L1-07..15 = 1+6+9 = 16
    expect(VE_RUNBOOK_SKILLS).toHaveLength(16);
    expect(skillsForProduct("v-exchange-perp")).toHaveLength(16);
    expect(skillsForProduct("cfd-broker").some((s) => s.id.startsWith("ve-sk-"))).toBe(false);
    expect(getSkill("ve-l1-02-depth-shortfall")?.titleZh).toContain("深度不足");
    expect(getSkill("ve-l1-07-internal-price-deviation")?.titleZh).toContain("内部价格偏差");
  });
});
