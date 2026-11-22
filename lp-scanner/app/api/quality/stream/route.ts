import { listLps } from "@/lib/db";
import { buildQualityReport, stepDelayMs } from "@/lib/quality-research";
import { rankLpsForProduct } from "@/lib/rank";
import { findLp, researchLp } from "@/lib/research";
import type { Locale, LpRecord } from "@/lib/types";
import { isZh } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = (url.searchParams.get("mode") as "product" | "lp") || "product";
  const query = url.searchParams.get("q")?.trim() ?? "";
  const lpId = url.searchParams.get("lpId")?.trim() ?? "";
  const productHint = url.searchParams.get("product")?.trim() || undefined;
  const locale = (url.searchParams.get("locale") as Locale) || "en";

  if (!query && !lpId) {
    return new Response("q or lpId required", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send("status", {
          phase: "init",
          message:
            isZh(locale) ? "正在加载仓库与知识库…" : "Loading repository & knowledge base…",
        });

        const all = await listLps();
        let report;

        if (mode === "product") {
          send("status", {
            phase: "rank",
            message:
              isZh(locale)
                ? `正在对品种 ${query} 排序候选 LP…`
                : `Ranking candidate LPs for ${query}…`,
          });
          const ranked = rankLpsForProduct(all, query, locale);
          send("status", {
            phase: "live",
            message:
              isZh(locale)
                ? "正在拉取公开资料与仓库实据…"
                : "Pulling public sources + repository evidence…",
          });
          const live = ranked.rankings[0]
            ? await researchLp(all, ranked.rankings[0].lp.name, locale).catch(() => null)
            : null;
          report = buildQualityReport({
            mode: "product",
            locale,
            product: ranked.product,
            lps: ranked.rankings.map((r) => r.lp),
            rankings: ranked.rankings,
            liveFindings: live?.liveFindings?.slice(0, 4) ?? [],
          });
        } else {
          send("status", {
            phase: "resolve",
            message:
              isZh(locale) ? `正在解析 LP ${query || lpId}…` : `Resolving LP ${query || lpId}…`,
          });
          const matched = lpId
            ? all.find((l) => l.id === lpId || l.slug === lpId)
            : findLp(all, query);
          const primary: LpRecord =
            matched ??
            ({
              id: "draft",
              slug: "draft",
              name: query || lpId,
              aliases: [],
              category: "traditional",
              usedByVantage: false,
              regions: ["Global"],
              hours: "24/5",
              assetClasses: ["fx"],
              products: [],
              costTier: "negotiated",
              pricingQuality: 3,
              latencyProfile: "medium",
              regulation: ["Unverified"],
              strengths: [],
              weaknesses: ["Not yet in repository"],
              bestFor: [],
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
            } as LpRecord);
          const peers = all
            .filter((l) => l.id !== primary.id)
            .filter(
              (l) =>
                l.category === primary.category ||
                l.assetClasses.some((a) => primary.assetClasses.includes(a)),
            )
            .slice(0, 4);
          send("status", {
            phase: "live",
            message:
              isZh(locale)
                ? "正在拉取公开资料与品种适配分…"
                : "Pulling public sources + product-fit scores…",
          });
          const live = await researchLp(all, primary.name, locale).catch(() => null);
          const ranked = productHint
            ? rankLpsForProduct(all, productHint, locale)
            : undefined;
          report = buildQualityReport({
            mode: "lp",
            locale,
            product: productHint,
            lps: [primary, ...peers],
            rankings: ranked?.rankings,
            liveFindings: live?.liveFindings?.slice(0, 4) ?? [],
          });
        }

        send("meta", {
          subject: report.subject,
          product: report.product,
          overallScore: report.overallScore,
          stepCount: report.steps.length,
          generatedAt: report.generatedAt,
        });

        for (const step of report.steps) {
          send("step_start", {
            id: step.id,
            index: step.index,
            title: step.title,
            action: step.action,
          });
          await new Promise((r) => setTimeout(r, stepDelayMs(step.index)));
          send("step_done", step);
        }

        send("complete", {
          report: {
            ...report,
            // steps already streamed; include full for download
          },
        });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "quality research failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
