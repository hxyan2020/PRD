export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-mist sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display text-base text-foam">VentureScan</span>
          {" — "}worldwide startup ideas & fundraising ledger
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
          Scan · store · surface
        </p>
      </div>
    </footer>
  );
}
