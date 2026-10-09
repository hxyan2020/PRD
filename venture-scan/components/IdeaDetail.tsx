"use client";

import Link from "next/link";
import { CollectButton } from "@/components/CollectButton";
import { Flag } from "@/components/Flag";
import { IdeaChatbot } from "@/components/IdeaChatbot";
import { IdeaSourceMedia } from "@/components/IdeaSourceMedia";
import { countryToFlagCode } from "@/lib/flag-codes";
import { formatMoney, socialLabel, strategyMessageKey } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { localizeIdea } from "@/lib/i18n/localize-idea";
import type { StartupIdea } from "@/lib/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-white/10 py-4 sm:grid-cols-[160px_1fr] sm:gap-6">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{label}</dt>
      <dd className="text-sm leading-relaxed text-foam">{children}</dd>
    </div>
  );
}

export function IdeaDetail({ idea }: { idea: StartupIdea }) {
  const { t, locale } = useI18n();
  const view = localizeIdea(idea, locale);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/#ideas" className="text-sm text-mist hover:text-foam">
        {t("dossier.back")}
      </Link>

      <header className="mt-6 animate-rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
          {view.industry} · {view.sector}
        </p>
        <h1 className="mt-3 font-display text-4xl text-foam sm:text-5xl">{view.name}</h1>
        <p className="mt-4 text-base leading-relaxed text-mist">{view.description}</p>
      </header>

      <dl className="mt-10 animate-rise [animation-delay:100ms]">
        <Row label={t("dossier.name")}>{view.name}</Row>
        <Row label={t("dossier.description")}>
          <p>{view.description}</p>
          <p className="mt-3 text-mist">
            <span className="text-foam">{t("dossier.howMoney")} </span>
            {view.businessModel}
          </p>
        </Row>
        <Row label={t("dossier.location")}>
          <span className="inline-flex items-center gap-1.5">
            <Flag
              code={countryToFlagCode(idea.teamCountry) ?? ""}
              title={idea.teamCountry}
              size="sm"
            />
            {idea.teamCountry}
            {idea.teamCity ? ` · ${idea.teamCity}` : ""}
          </span>
        </Row>
        <Row label={t("dossier.teamSize")}>{t("common.people", { count: idea.teamSize })}</Row>
        <Row label={t("dossier.industry")}>{view.industry}</Row>
        <Row label={t("dossier.sector")}>{view.sector}</Row>
        <Row label={t("dossier.fundraising")}>
          {idea.fundraisingSecured ? (
            <span>
              {t("common.yes")} — {idea.fundingStage ?? "secured"}
              {idea.fundingAmountUsd != null ? ` · ${formatMoney(idea.fundingAmountUsd)}` : ""}
              {view.fundingRoundNote ? (
                <span className="mt-1 block text-mist">{view.fundingRoundNote}</span>
              ) : null}
            </span>
          ) : (
            <span>
              {t("common.notYet")}
              {view.fundingRoundNote ? (
                <span className="mt-1 block text-mist">{view.fundingRoundNote}</span>
              ) : null}
            </span>
          )}
        </Row>
        <Row label={t("dossier.website")}>
          {idea.website ? (
            <a
              href={idea.website}
              target="_blank"
              rel="noreferrer"
              className="text-celadon underline-offset-2 hover:underline break-all"
            >
              {(() => {
                try {
                  return new URL(idea.website).hostname.replace(/^www\./, "");
                } catch {
                  return idea.website;
                }
              })()}
            </a>
          ) : (
            <span className="text-mist">—</span>
          )}
        </Row>
        <Row label={t("dossier.social")}>
          {idea.social.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {idea.social.map((s) => (
                <li key={`${s.platform}-${s.handle}-${s.url}`}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-celadon underline-offset-2 hover:underline"
                  >
                    {socialLabel(s.platform)} · {s.handle}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-mist">—</span>
          )}
        </Row>
        <Row label={t("dossier.goForward")}>
          <p className="font-medium text-foam">{t(strategyMessageKey(idea.goForward.strategy))}</p>
          <p className="mt-2 text-mist">{view.goForward.summary}</p>
        </Row>
      </dl>

      <div className="mt-8">
        <CollectButton idea={idea} />
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-mist/70">
        {t("common.source")} {idea.source} · {t("common.scanned")}{" "}
        {new Date(idea.scannedAt).toLocaleString()}
      </p>

      <IdeaSourceMedia idea={idea} />

      <IdeaChatbot idea={view} />
    </article>
  );
}
