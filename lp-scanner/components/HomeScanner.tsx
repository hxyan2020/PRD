"use client";

import { useState } from "react";
import { SortableResults } from "@/components/SortableResults";
import { useI18n } from "@/lib/i18n/context";
import type { LpResearchResult, RankedLp } from "@/lib/types";

export function HomeScanner() {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<"product" | "lp">("product");
  const [query, setQuery] = useState("XAUUSD");
  const [busy, setBusy] = useState(false);
  const [productResult, setProductResult] = useState<{
    product: string;
    rankings: RankedLp[];
    researchedAt: string;
  } | null>(null);
  const [lpResult, setLpResult] = useState<LpResearchResult | null>(null);
  const [added, setAdded] = useState(false);

  async function scan() {
    const q = query.trim();
    if (!q || busy) return;
    setBusy(true);
    setAdded(false);
    try {
      if (mode === "product") {
        const res = await fetch(`/api/scan/product?q=${encodeURIComponent(q)}&locale=${locale}`);
        const data = await res.json();
        setProductResult(data);
        setLpResult(null);
      } else {
        const res = await fetch(`/api/scan/lp?q=${encodeURIComponent(q)}&locale=${locale}`);
        const data = await res.json();
        setLpResult(data);
        setProductResult(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function addToRepo() {
    if (!lpResult) return;
    const payload = lpResult.matched
      ? { ...lpResult.matched, usedByVantage: false }
      : {
          name: lpResult.query,
          products: lpResult.recommendedProducts,
          bestFor: lpResult.goodFor,
          notes: lpResult.summary,
          kbBodyEn: lpResult.summary + "\n" + lpResult.liveFindings.join("\n"),
          kbBodyZh: lpResult.summary + "\n" + lpResult.liveFindings.join("\n"),
          category: /btc|eth|crypto|okx|binance|bybit|gate|bitget|kraken/i.test(lpResult.query)
            ? "crypto"
            : "traditional",
          hours: /btc|eth|crypto|okx|binance|bybit|gate|bitget|kraken/i.test(lpResult.query)
            ? "24/7"
            : "24/5",
          usedByVantage: false,
        };
    const res = await fetch("/api/lps", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setAdded(true);
  }

  return (
    <div className="space-y-6">
      <section className="panel relative overflow-hidden px-5 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden">
          <div className="h-full w-1/3 bg-teal/70 animate-scan" />
        </div>
        <h1 className="max-w-3xl font-display text-3xl leading-tight text-navy sm:text-5xl">
          {t("home.hero")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-mist sm:text-base">{t("home.sub")}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === "product" ? "bg-navy text-foam" : "bg-slate/60"}`}
            onClick={() => setMode("product")}
          >
            {t("home.tab.product")}
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === "lp" ? "bg-navy text-foam" : "bg-slate/60"}`}
            onClick={() => setMode("lp")}
          >
            {t("home.tab.lp")}
          </button>
        </div>

        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void scan();
          }}
        >
          <input
            className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-teal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "product" ? t("home.product.placeholder") : t("home.lp.placeholder")}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-teal px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? t("home.scanning") : t("home.scan")}
          </button>
        </form>
      </section>

      {!productResult && !lpResult && (
        <p className="text-center text-sm text-mist">{t("home.empty")}</p>
      )}

      {productResult && (
        <SortableResults rankings={productResult.rankings} researchedAt={productResult.researchedAt} />
      )}

      {lpResult && (
        <section className="panel animate-rise px-5 py-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-teal">
                {lpResult.isNew ? t("research.new") : lpResult.matched?.name}
              </p>
              <h2 className="font-display text-3xl text-navy">{lpResult.query}</h2>
              <p className="mt-2 max-w-3xl text-sm text-navy-2">{lpResult.summary}</p>
              <p className="mt-2 text-xs text-mist">
                {t("home.liveAt")}{" "}
                {new Date(lpResult.researchedAt).toLocaleString(
                  locale === "zh-CN" ? "zh-CN" : "en-SG",
                  { timeZone: "Asia/Singapore" },
                )}{" "}
                (SGT)
              </p>
            </div>
            <button
              type="button"
              onClick={() => void addToRepo()}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-foam hover:bg-teal"
            >
              {added ? t("home.added") : t("home.addRepo")}
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <List title={t("research.goodFor")} items={lpResult.goodFor} />
            <List title={t("research.products")} items={lpResult.recommendedProducts} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                {t("research.competitors")}
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {lpResult.competitorComparison.map((c) => (
                  <li key={c.name} className="rounded-lg bg-slate/40 px-3 py-2">
                    <span className="font-semibold">{c.name}</span> · {c.relation}
                    <div className="text-mist">{c.edge}</div>
                  </li>
                ))}
              </ul>
            </div>
            <List title={t("research.findings")} items={lpResult.liveFindings} />
          </div>
          {lpResult.sources.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                {t("research.sources")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {lpResult.sources.map((s) => (
                  <li key={s.url}>
                    <a className="text-teal underline" href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy-2">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
