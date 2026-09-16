import { NavLinks } from "./NavLinks";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] tracking-[0.28em] text-gold uppercase">
                Desk note
              </p>
              <h1 className="font-serif text-3xl leading-tight text-paper md:text-4xl">
                Vantage Market Intelligence
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Daily coverage of the world&apos;s top 50 banks, 50 brokers, and 50
                crypto exchanges — listings, product releases, regulation, and
                risk-tool developments.
              </p>
            </div>
            <p className="font-mono text-[11px] text-muted">
              Scan window: last 24h · Monday covers since Friday
            </p>
          </div>
          <NavLinks />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted">
          Public RSS, official newsrooms, and Google News topic feeds. Source
          health and last-sourced timestamps are on the Sources page. Not
          investment advice.
        </div>
      </footer>
    </div>
  );
}
