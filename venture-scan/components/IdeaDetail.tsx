import Link from "next/link";
import { CollectButton } from "@/components/CollectButton";
import { Flag } from "@/components/Flag";
import { IdeaChatbot } from "@/components/IdeaChatbot";
import { IdeaSourceMedia } from "@/components/IdeaSourceMedia";
import { countryToFlagCode } from "@/lib/flag-codes";
import { formatMoney, socialLabel, strategyLabel } from "@/lib/format";
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
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/#ideas" className="text-sm text-mist hover:text-foam">
        ← Back to ledger
      </Link>

      <header className="mt-6 animate-rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
          {idea.industry} · {idea.sector}
        </p>
        <h1 className="mt-3 font-display text-4xl text-foam sm:text-5xl">{idea.name}</h1>
        <p className="mt-4 text-base leading-relaxed text-mist">{idea.description}</p>
      </header>

      <dl className="mt-10 animate-rise [animation-delay:100ms]">
        <Row label="(i) Idea name">{idea.name}</Row>
        <Row label="(ii) Full description">
          <p>{idea.description}</p>
          <p className="mt-3 text-mist">
            <span className="text-foam">How it makes money: </span>
            {idea.businessModel}
          </p>
        </Row>
        <Row label="(iii) Team location">
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
        <Row label="(iv) Team size">{idea.teamSize} people</Row>
        <Row label="(v) Industry">{idea.industry}</Row>
        <Row label="(vi) Sector">{idea.sector}</Row>
        <Row label="(vii) Fundraising secured?">
          {idea.fundraisingSecured ? (
            <span>
              Yes — {idea.fundingStage ?? "secured"}
              {idea.fundingAmountUsd != null ? ` · ${formatMoney(idea.fundingAmountUsd)}` : ""}
              {idea.fundingRoundNote ? (
                <span className="mt-1 block text-mist">{idea.fundingRoundNote}</span>
              ) : null}
            </span>
          ) : (
            <span>
              Not yet
              {idea.fundingRoundNote ? (
                <span className="mt-1 block text-mist">{idea.fundingRoundNote}</span>
              ) : null}
            </span>
          )}
        </Row>
        <Row label="(viii) Official website">
          <a
            href={idea.website}
            target="_blank"
            rel="noreferrer"
            className="text-celadon underline-offset-2 hover:underline"
          >
            {idea.website}
          </a>
        </Row>
        <Row label="(ix) Social media">
          <ul className="flex flex-col gap-1.5">
            {idea.social.map((s) => (
              <li key={`${s.platform}-${s.handle}`}>
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
        </Row>
        <Row label="(x) Go-forward play">
          <p className="font-medium text-foam">{strategyLabel(idea.goForward.strategy)}</p>
          <p className="mt-2 text-mist">{idea.goForward.summary}</p>
        </Row>
      </dl>

      <div className="mt-8">
        <CollectButton idea={idea} />
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-mist/70">
        Source {idea.source} · scanned {new Date(idea.scannedAt).toLocaleString()}
      </p>

      <IdeaSourceMedia idea={idea} />

      <IdeaChatbot idea={idea} />
    </article>
  );
}
