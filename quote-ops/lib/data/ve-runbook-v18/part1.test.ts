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
  it("registers part 1 and leaves 2–4 pending", () => {
    expect(RUNBOOK_V18_INGESTED_PARTS).toEqual([1]);
    expect(RUNBOOK_V18_PENDING_PARTS).toEqual([2, 3, 4]);
  });

  it("builds overview + combined L1 book + 6 per-L1 skill docs with tables", () => {
    const docs = buildVeRunbookV18Docs();
    expect(docs).toHaveLength(8);
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

    const l101 = docs.find((d) => d.slug === "ve-l1-01-no-trade");
    expect(l101?.bodyZh).toContain("| 步骤 | 执行人 |");
    expect(l101?.bodyZh).toContain("连续40秒无交易");
  });

  it("is included in VE_DOCS and bumps seed version", () => {
    expect(VE_DOCS.some((d) => d.id === "ve-skill-runbook-v18-l1-01-06")).toBe(true);
    expect(VE_META.version).toBe("V2.1");
  });

  it("exposes interactive skills on VE product only", () => {
    expect(VE_RUNBOOK_SKILLS).toHaveLength(7);
    expect(skillsForProduct("v-exchange-perp")).toHaveLength(7);
    expect(skillsForProduct("cfd-broker").some((s) => s.id.startsWith("ve-sk-"))).toBe(false);
    expect(getSkill("ve-l1-02-depth-shortfall")?.titleZh).toContain("深度不足");
  });
});
