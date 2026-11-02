"use client";

import { DESK_12_SCENARIOS, NOISE_TECHNIQUE_CATALOGUE } from "@/lib/demo/desk-12-pack";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";

/** Scenario-derived noise reduction methods for the desk-12 pack. */
export function Desk12NoiseMethods() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";

  return (
    <section
      className="rounded-2xl border border-black/10 bg-white/90 p-3 sm:p-4"
      data-testid="desk-12-noise-methods"
    >
      <h3 className="text-sm font-semibold">
        <EnZh en="Noise methods from the 12 scenarios" zh="由 12 則情境衍生的降噪方法" />
      </h3>
      <p className="mt-1 text-xs text-[var(--muted)]">
        <EnZh
          en="Covers threshold optimisation, severity optimisation, persistence, dedup, SEQUENCE, P0 bypass, shadow, batching, and dynamic multipliers — not limited to one technique per alert."
          zh="涵蓋閾值優化、嚴重度優化、持續性、去重、SEQUENCE、P0 旁路、Shadow、批次合併與動態倍數 — 不限於每則警報一種手法。"
        />
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5" data-testid="noise-technique-catalogue">
        {NOISE_TECHNIQUE_CATALOGUE.map((t) => (
          <li
            key={t.id}
            className="rounded-md border border-teal-200 bg-teal-50/70 px-2 py-1 text-[11px] text-teal-950"
          >
            {zh ? t.zh : t.en}
          </li>
        ))}
      </ul>
      <div className="mt-3 overflow-x-auto">
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
