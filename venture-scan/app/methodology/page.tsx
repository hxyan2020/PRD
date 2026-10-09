"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function MethodologyPage() {
  const { t } = useI18n();

  const steps: {
    labelKey:
      | "method.scanLabel"
      | "method.storeLabel"
      | "method.surfaceLabel"
      | "method.matchLabel"
      | "method.dailyLabel"
      | "method.collectLabel"
      | "method.languagesLabel"
      | "method.mobileLabel";
    bodyKey:
      | "method.scan"
      | "method.store"
      | "method.surface"
      | "method.match"
      | "method.daily"
      | "method.collect"
      | "method.languages"
      | "method.mobile";
  }[] = [
    { labelKey: "method.scanLabel", bodyKey: "method.scan" },
    { labelKey: "method.storeLabel", bodyKey: "method.store" },
    { labelKey: "method.surfaceLabel", bodyKey: "method.surface" },
    { labelKey: "method.matchLabel", bodyKey: "method.match" },
    { labelKey: "method.dailyLabel", bodyKey: "method.daily" },
    { labelKey: "method.collectLabel", bodyKey: "method.collect" },
    { labelKey: "method.languagesLabel", bodyKey: "method.languages" },
    { labelKey: "method.mobileLabel", bodyKey: "method.mobile" },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-foam">{t("method.title")}</h1>
      <ol className="mt-8 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-mist">
        {steps.map((step) => (
          <li key={step.labelKey}>
            <span className="text-foam">{t(step.labelKey)}</span> — {t(step.bodyKey)}
          </li>
        ))}
        <li>
          <span className="text-foam">{t("method.sourcesLabel")}</span> —{" "}
          {t("method.sourcesBefore") ? `${t("method.sourcesBefore")} ` : null}
          <Link className="text-celadon underline-offset-2 hover:underline" href="/sources">
            {t("method.sourcesLink")}
          </Link>{" "}
          {t("method.sourcesAfter")}
        </li>
        <li>
          <span className="text-foam">{t("method.urlLabel")}</span> — {t("method.url")}{" "}
          <a
            className="text-celadon underline-offset-2 hover:underline"
            href="https://hxyan2020.github.io/PRD/venture-scan/"
          >
            hxyan2020.github.io/PRD/venture-scan/
          </a>
          .
        </li>
      </ol>
      <p className="mt-8 text-sm text-mist">{t("method.seed")}</p>
    </div>
  );
}
