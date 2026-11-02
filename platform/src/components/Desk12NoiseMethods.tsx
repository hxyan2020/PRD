"use client";

import {
  DESK_12_SCENARIOS,
  NOISE_TECHNIQUE_CATALOGUE,
  noiseCatalogueCoversCoreTrio,
  type NoiseTechniqueId,
} from "@/lib/demo/desk-12-pack";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";

/** Scenario-derived noise reduction methods for the desk-12 pack. */
export function Desk12NoiseMethods() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const coreOk = noiseCatalogueCoversCoreTrio();

  const coverage = NOISE_TECHNIQUE_CATALOGUE.map((t) => {
    const scenarios = DESK_12_SCENARIOS.filter((s) => s.noise.techniques.includes(t.id));
    return { ...t, scenarios };
  });

  return (
    <section
      className="rounded-2xl border border-black/10 bg-white/90 p-3 sm:p-4 space-y-4"
      data-testid="desk-12-noise-methods"
    >
      <div>
        <h3 className="text-sm font-semibold">
          <EnZh en="Noise methods from the 12 scenarios" zh="由 12 則情境衍生的降噪方法" />
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          <EnZh
            en="Must cover — and is not limited to — threshold optimisation, severity optimisation, and persistence. Also includes hysteresis, quality gates, flapping suppression, rate-limits, SEQUENCE/AND, P0 bypass, shadow, batching, dynamic multipliers, human feedback, and backtest→shadow→approve."
            zh="必須涵蓋且不限於：閾值優化、嚴重度優化、持續性。另含滯後帶、質量閘門、抖動抑制、限速、SEQUENCE／AND、P0 旁路、Shadow、批次合併、動態倍數、人工回饋、回測→Shadow→核准。"
          />
        </p>
        <p
          className={`mt-1 text-[11px] font-semibold ${coreOk ? "text-teal-800" : "text-rose-700"}`}
          data-testid="noise-core-trio"
        >
          {coreOk ? (
            <EnZh
              en="Core trio present: threshold · severity · persistence"
              zh="核心三件已具備：閾值 · 嚴重度 · 持續性"
            />
          ) : (
            <EnZh en="Core trio missing — fix catalogue" zh="核心三件缺失 — 請修正目錄" />
          )}
        </p>
      </div>

      <ul className="flex flex-wrap gap-1.5" data-testid="noise-technique-catalogue">
        {NOISE_TECHNIQUE_CATALOGUE.map((t) => (
          <li
            key={t.id}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              t.core
                ? "border-teal-400 bg-teal-100/80 text-teal-950 font-semibold"
                : "border-teal-200 bg-teal-50/70 text-teal-950"
            }`}
          >
            {t.core ? (zh ? "核心 · " : "Core · ") : null}
            {zh ? t.zh : t.en}
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto" data-testid="noise-coverage-matrix">
        <table className="w-full min-w-[720px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-black/10 text-[var(--muted)]">
              <th className="py-2 pr-2 font-semibold sticky left-0 bg-white/95">
                <EnZh en="Technique" zh="手法" />
              </th>
              {DESK_12_SCENARIOS.map((s) => (
                <th key={s.code} className="py-2 px-1 font-semibold whitespace-nowrap" title={zh ? s.name.zh : s.name.en}>
                  {s.code.replace(/^SCN-/, "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coverage.map((t) => (
              <tr key={t.id} className="border-b border-black/5">
                <td className="py-1.5 pr-2 sticky left-0 bg-white/95">
                  <span className={t.core ? "font-semibold text-teal-900" : ""}>
                    {(zh ? t.zh : t.en).split(" — ")[0]}
                  </span>
                  <div className="text-[10px] text-[var(--muted)]">{t.id}</div>
                </td>
                {DESK_12_SCENARIOS.map((s) => {
                  const hit = s.noise.techniques.includes(t.id as NoiseTechniqueId);
                  return (
                    <td key={s.code} className="py-1.5 px-1 text-center">
                      {hit ? (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600" aria-label="used" />
                      ) : (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-200" aria-label="unused" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-black/10 text-[var(--muted)]">
              <th className="py-2 pr-2 font-semibold">
                <EnZh en="Scenario" zh="情境" />
              </th>
              <th className="py-2 pr-2 font-semibold">
                <EnZh en="Method" zh="方法" />
              </th>
              <th className="py-2 pr-2 font-semibold">
                <EnZh en="Techniques" zh="手法" />
              </th>
              <th className="py-2 font-semibold">
                <EnZh en="Knobs" zh="旋鈕" />
              </th>
            </tr>
          </thead>
          <tbody>
            {DESK_12_SCENARIOS.map((s) => (
              <tr key={s.code} className="border-b border-black/5 align-top">
                <td className="py-2 pr-2">
                  <div className="font-medium">{zh ? s.name.zh : s.name.en}</div>
                  <code className="text-[10px] text-[var(--muted)]">
                    {s.noise.code} · {s.alert_id}
                  </code>
                </td>
                <td className="py-2 pr-2">{zh ? s.noise.zh : s.noise.en}</td>
                <td className="py-2 pr-2 text-[10px] text-[var(--muted)]">{s.noise.techniques.join(", ")}</td>
                <td className="py-2">
                  <ul className="list-disc pl-4 space-y-0.5">
                    {s.noise.knobs.map((k, i) => (
                      <li key={i}>{zh ? k.zh : k.en}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
