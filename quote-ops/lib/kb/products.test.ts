import { describe, expect, it } from "vitest";
import {
  inferProductFromQuery,
  queryConflictsWithProduct,
} from "@/lib/kb/products";

describe("inferProductFromQuery", () => {
  it("detects V Exchange perpetual signals", () => {
    expect(inferProductFromQuery("外部 Funding 偏差超过 0.1%")).toBe("v-exchange-perp");
    expect(inferProductFromQuery("资金费率结算周期")).toBe("v-exchange-perp");
    expect(inferProductFromQuery("DB 接仓失败 ADL")).toBe("v-exchange-perp");
    expect(inferProductFromQuery("V Exchange Index Fallback")).toBe("v-exchange-perp");
    expect(inferProductFromQuery("永续合约 Mark Price")).toBe("v-exchange-perp");
  });

  it("detects CFD Broker signals", () => {
    expect(inferProductFromQuery("旧价成交 Quote Age RCA")).toBe("cfd-broker");
    expect(inferProductFromQuery("LP 到 PE 到 MT 报价流程")).toBe("cfd-broker");
    expect(inferProductFromQuery("Latency Arbitrage markout")).toBe("cfd-broker");
    expect(inferProductFromQuery("CFD broker stale quote")).toBe("cfd-broker");
  });

  it("does not flip on shared/ambiguous words alone", () => {
    expect(inferProductFromQuery("强平")).toBeNull();
    expect(inferProductFromQuery("index")).toBeNull();
    expect(inferProductFromQuery("pe")).toBeNull();
    expect(inferProductFromQuery("mt")).toBeNull();
    expect(inferProductFromQuery("")).toBeNull();
  });

  it("keeps CFD stop-out wording on CFD when marked as quote RCA", () => {
    expect(inferProductFromQuery("强平漏洞 RCA 旧价")).toBe("cfd-broker");
  });

  it("reports conflict against current product", () => {
    expect(queryConflictsWithProduct("资金费率", "cfd-broker")).toBe("v-exchange-perp");
    expect(queryConflictsWithProduct("旧价成交", "v-exchange-perp")).toBe("cfd-broker");
    expect(queryConflictsWithProduct("资金费率", "v-exchange-perp")).toBeNull();
  });
});
