import { NextRequest, NextResponse } from "next/server";
import { listLps } from "@/lib/db";
import { buildPrintableHtml, buildQualityReport } from "@/lib/quality-research";
import { rankLpsForProduct } from "@/lib/rank";
import { findLp } from "@/lib/research";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    mode?: "product" | "lp";
    query?: string;
    lpId?: string;
    locale?: Locale;
    format?: "json" | "html";
  };
  const mode = body.mode ?? "product";
  const query = body.query?.trim() ?? "";
  const locale = body.locale ?? "en";
  if (!query && !body.lpId) {
    return NextResponse.json({ error: "query or lpId required" }, { status: 400 });
  }

  const all = await listLps();

  let report;
  if (mode === "product") {
    const ranked = rankLpsForProduct(all, query, locale);
    report = buildQualityReport({
      mode: "product",
      locale,
      product: ranked.product,
      lps: ranked.rankings.map((r) => r.lp),
      rankings: ranked.rankings,
    });
  } else {
    const matched = body.lpId
      ? all.find((l) => l.id === body.lpId || l.slug === body.lpId)
      : findLp(all, query);
    if (!matched) {
      // Draft minimal LP shell for unknown names
      const draft = {
        id: "draft",
        slug: "draft",
        name: query,
        aliases: [] as string[],
        category: "traditional" as const,
        usedByVantage: false,
        regions: ["Global"],
        hours: "24/5" as const,
        assetClasses: ["fx" as const],
        products: [] as string[],
        costTier: "negotiated" as const,
        pricingQuality: 3 as const,
        latencyProfile: "medium" as const,
        regulation: ["Unverified"],
        strengths: [] as string[],
        weaknesses: ["Not yet in repository — proxy scores only"],
        bestFor: [] as string[],
        notes: "",
        kbBodyEn: "",
        kbBodyZh: "",
        scoreHints: {
          gold: 50,
          fxMajors: 50,
          indices: 50,
          oil: 50,
          crypto: 50,
          asia: 50,
        },
        updatedAt: new Date().toISOString(),
      };
      report = buildQualityReport({ mode: "lp", locale, lps: [draft] });
    } else {
      // Include peer set for comparison
      const peers = all
        .filter((l) => l.id !== matched.id)
        .filter(
          (l) =>
            l.category === matched.category ||
            l.assetClasses.some((a) => matched.assetClasses.includes(a)),
        )
        .slice(0, 4);
      report = buildQualityReport({ mode: "lp", locale, lps: [matched, ...peers] });
    }
  }

  if (body.format === "html") {
    const html = buildPrintableHtml(report);
    return new NextResponse(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `attachment; filename="lp-quality-${report.subject.replace(/\s+/g, "-").toLowerCase()}.html"`,
      },
    });
  }

  return NextResponse.json({ report });
}
