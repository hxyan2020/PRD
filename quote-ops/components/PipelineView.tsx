"use client";

import { useState } from "react";
import { PIPELINE_STAGES, PIPELINE_SUMMARY } from "@/lib/data/pipeline";
import { useI18n } from "@/lib/i18n/context";

export function PipelineView() {
  const { locale, t } = useI18n();
  const [active, setActive] = useState(PIPELINE_STAGES[0]!.id);
  const stage = PIPELINE_STAGES.find((s) => s.id === active) ?? PIPELINE_STAGES[0]!;

  return (
    <div className="space-y-6 animate-rise">
      <header>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          {t("定价全流程 · LP → PE → MT", "Pricing pipeline · LP → PE → MT")}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mist">
          {locale === "zh-CN" ? PIPELINE_SUMMARY.principleZh : PIPELINE_SUMMARY.principle}
        </p>
        <p className="mt-2 max-w-3xl text-sm font-medium text-sea">
          {locale === "zh-CN" ? PIPELINE_SUMMARY.evidenceChainZh : PIPELINE_SUMMARY.evidenceChain}
        </p>
      </header>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[720px] items-stretch gap-0">
          {PIPELINE_STAGES.map((st, idx) => {
            const on = st.id === active;
            return (
              <div key={st.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  id={st.id}
                  onClick={() => setActive(st.id)}
                  className={`w-full rounded-xl border px-3 py-4 text-left transition ${
                    on
                      ? "border-ink bg-ink text-paper shadow-lg"
                      : "border-line bg-white/80 text-ink hover:border-sea/50"
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-snug">
                    {locale === "zh-CN" ? st.nameZh : st.name}
                  </div>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="mx-1 h-px w-4 shrink-0 bg-copper animate-pulse-line" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <article className="rounded-2xl border border-line bg-white/85 p-5 sm:p-7">
        <h2 className="font-display text-2xl text-ink">
          {locale === "zh-CN" ? stage.nameZh : stage.name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          {locale === "zh-CN" ? stage.roleZh : stage.role}
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Block
            title={t("输入", "Inputs")}
            items={stage.inputs}
          />
          <Block
            title={t("输出", "Outputs")}
            items={stage.outputs}
          />
          <Block
            title={t("故障模式", "Failure modes")}
            items={locale === "zh-CN" ? stage.failureModesZh : stage.failureModes}
            tone="danger"
          />
          <Block
            title={t("关键检查", "Key checks")}
            items={locale === "zh-CN" ? stage.checksZh : stage.checks}
            tone="ok"
          />
        </div>

        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mist">
            {t("相关系统", "Systems")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {stage.systems.map((sys) => (
              <span
                key={sys}
                className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-ink-2"
              >
                {sys}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

function Block({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "danger" | "ok";
}) {
  const bullet =
    tone === "danger" ? "bg-danger" : tone === "ok" ? "bg-ok" : "bg-sea";
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-mist">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bullet}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
