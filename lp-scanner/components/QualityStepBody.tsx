"use client";

import { QualityBarChart } from "@/components/QualityBarChart";
import { TypingText } from "@/components/TypingText";
import { useI18n } from "@/lib/i18n/context";
import type { QualityDataSource, QualityStep } from "@/lib/quality-research";

type UiStatus = "pending" | "running" | "done" | "warn";

type Props = {
  step: QualityStep & { uiStatus: UiStatus };
};

function DataSourceList({ sources }: { sources: QualityDataSource[] }) {
  const { t } = useI18n();
  if (!sources.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">
        {t("quality.dataSources")}
      </p>
      <ul className="space-y-2">
        {sources.map((ds) => (
          <li
            key={ds.id}
            className={`rounded-md border px-3 py-2 text-sm ${
              ds.available
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-amber/30 bg-amber-soft/40"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-navy">{ds.name}</span>
              <span
                className={`chip text-[10px] ${
                  ds.available ? "bg-emerald-100 text-emerald-800" : "bg-amber-soft text-amber"
                }`}
              >
                {ds.available ? t("quality.dataAvailable") : t("quality.dataUnavailable")}
              </span>
            </div>
            {ds.note && <p className="mt-1 text-xs text-mist">{ds.note}</p>}
            {ds.url && (
              <p className="mt-1 text-xs">
                <a
                  href={ds.url}
                  target={ds.url.startsWith("http") ? "_blank" : undefined}
                  rel={ds.url.startsWith("http") ? "noreferrer" : undefined}
                  className="break-all text-teal underline-offset-2 hover:underline"
                >
                  {ds.url}
                </a>
              </p>
            )}
            {!ds.available && ds.howToGet && (
              <p className="mt-1 text-xs leading-relaxed text-navy-2">
                <span className="font-semibold text-amber">{t("quality.howToGet")}: </span>
                {ds.howToGet}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QualityStepBody({ step }: Props) {
  const { t } = useI18n();
  const running = step.uiStatus === "running";
  const finished = step.uiStatus === "done" || step.uiStatus === "warn";
  const analysis = step.analysis || step.result;

  return (
    <>
      <p className="mt-2 text-sm text-mist">
        <span className="font-medium text-navy-2">{t("quality.action")}: </span>
        <TypingText text={step.action} active={running || finished} cps={running ? 56 : 72} />
      </p>

      {finished && step.result && (
        <p className="mt-1 text-sm text-navy-2">
          <span className="font-medium">{t("quality.result")}: </span>
          <TypingText text={step.result} active cps={52} />
        </p>
      )}

      {finished && analysis && (
        <p className="mt-2 text-sm leading-relaxed text-navy-2">
          <span className="font-medium text-teal">{t("quality.analysis")}: </span>
          <TypingText text={analysis} active cps={44} />
        </p>
      )}

      {finished && step.details.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-navy-2">
          {step.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}

      {finished && (step.charts?.length ?? 0) > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            {t("quality.charts")}
          </p>
          <div className="grid gap-2 sm:grid-cols-1">
            {step.charts!.map((c) => (
              <QualityBarChart key={c.id} chart={c} />
            ))}
          </div>
        </div>
      )}

      {finished && step.dataSources && <DataSourceList sources={step.dataSources} />}

      {finished && (step.pros.length > 0 || step.cons.length > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-teal-soft/50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">
              {t("quality.pros")}
            </p>
            <ul className="mt-1 list-disc pl-4 text-sm text-navy-2">
              {step.pros.length ? step.pros.map((p, i) => <li key={i}>{p}</li>) : <li>—</li>}
            </ul>
          </div>
          <div className="rounded-lg bg-amber-soft/60 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber">
              {t("quality.cons")}
            </p>
            <ul className="mt-1 list-disc pl-4 text-sm text-navy-2">
              {step.cons.length ? step.cons.map((c, i) => <li key={i}>{c}</li>) : <li>—</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
