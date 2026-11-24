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
  it("registers all four parts with nothing pending", () => {
    expect(RUNBOOK_V18_INGESTED_PARTS).toEqual([1, 2, 3, 4]);
    expect(RUNBOOK_V18_PENDING_PARTS).toEqual([]);
  });

  it("builds overview + combined L1 books + per-L1/L2 skill docs with tables", () => {
    const docs = buildVeRunbookV18Docs();
    // part1: 8; part2: 10; part3: 17; part4: l2cf+4+meta=6 → 41
    expect(docs).toHaveLength(41);
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

    const ops = docs.find((d) => d.id === "ve-skill-runbook-v18-l1-16-28");
    expect(ops?.bodyZh.match(/\| 步骤 \| 执行人 \|/g)?.length).toBe(13);
    expect(ops?.bodyZh).toContain("L1-16｜外部资金费率偏差监控");
    expect(ops?.bodyZh).toContain("L1-28｜资金流水类型未匹配");
    expect(ops?.bodyZh).toContain("不得直接归入“其他”");

    const l2 = docs.find((d) => d.id === "ve-skill-runbook-v18-l2-a-b");
    expect(l2?.bodyZh).toContain("```mermaid");
    expect(l2?.bodyZh).toContain("L2-A｜指数源切换");
    expect(l2?.bodyZh).toContain("L2-B｜市场价格脱节");
    expect(l2?.bodyZh.match(/\| 步骤 \| 执行人 \|/g)?.length).toBe(2);

    const l101 = docs.find((d) => d.slug === "ve-l1-01-no-trade");
    expect(l101?.bodyZh).toContain("| 步骤 | 执行人 |");
    expect(l101?.bodyZh).toContain("连续40秒无交易");

    const l113 = docs.find((d) => d.slug === "ve-l1-13-index-source-switch");
    expect(l113?.bodyZh).toContain("| 步骤 | 执行人 |");
    expect(l113?.bodyZh).toContain("线性过渡");

    const l123 = docs.find((d) => d.slug === "ve-l1-23-large-liquidation");
    expect(l123?.bodyZh).toContain("大额爆仓通知本身不证明强平错误");

    const l2cf = docs.find((d) => d.id === "ve-skill-runbook-v18-l2-c-f");
    expect(l2cf?.bodyZh.match(/\| 步骤 \| 执行人 \|/g)?.length).toBe(4);
    expect(l2cf?.bodyZh.match(/```mermaid/g)?.length).toBe(2);
    expect(l2cf?.bodyZh).toContain("L2-C｜盘口流动性下降");
    expect(l2cf?.bodyZh).toContain("L2-F｜流动性下降");

    const linkage = docs.find((d) => d.id === "ve-skill-runbook-v18-linkage");
    expect(linkage?.bodyZh).toContain("| L1事件 | 必查关联告警");
    expect(linkage?.bodyZh).toContain("| L1 Runbook | 28 |");
    expect(linkage?.bodyZh).toContain("不重复创建独立事件");
  });

  it("is included in VE_DOCS and bumps seed version", () => {
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l1-01-06")).toBe(true);
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l1-07-15")).toBe(true);
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l1-16-28")).toBe(true);
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l2-a-b")).toBe(true);
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l2-c-f")).toBe(true);
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-linkage")).toBe(true);
    expect(VE_META.version).toBe("V2.4");
  });

  it("exposes interactive skills on VE product only", () => {
    // overview + L1-01..28 + L2-A..F + linkage = 1+28+6+1 = 36
    expect(VE_RUNBOOK_SKILLS).toHaveLength(36);
    expect(skillsForProduct("v-exchange-perp")).toHaveLength(36);
    expect(skillsForProduct("cfd-broker").some((s) => s.id.startsWith("ve-sk-"))).toBe(false);
    expect(getSkill("ve-l1-02-depth-shortfall")?.titleZh).toContain("深度不足");
    expect(getSkill("ve-l1-07-internal-price-deviation")?.titleZh).toContain("内部价格偏差");
    expect(getSkill("ve-l2-a-source-to-pricing")?.titleZh).toContain("L2-A");
    expect(getSkill("ve-l2-c-depth-to-no-trade")?.titleZh).toContain("L2-C");
    expect(getSkill("ve-runbook-v18-l1-l2-linkage")?.titleZh).toContain("联动入口");
  });
});
