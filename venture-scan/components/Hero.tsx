import Link from "next/link";

export function Hero({ count }: { count: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mesh" aria-hidden />
      <div className="relative mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
        <p className="animate-rise font-mono text-[11px] uppercase tracking-[0.28em] text-celadon">
          Worldwide startup ideas + fundraising
        </p>
        <h1 className="animate-rise mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-foam sm:text-7xl [animation-delay:80ms]">
          VentureScan
        </h1>
        <p className="animate-rise mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg [animation-delay:160ms]">
          Fresh signals from startups and fundraising events worldwide—stored in a database and
          surfaced with the fields you need to decide your next move.
        </p>
        <div className="animate-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
          <Link href="#ideas" className="btn-primary">
            Browse {count} ideas
          </Link>
          <Link href="/today" className="btn-ghost">
            Today's pick
          </Link>
          <Link href="/match" className="btn-ghost">
            Match with chatbot
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist/80">
            Name · model · team · funding · play
          </span>
        </div>
        <div
          className="pointer-events-none absolute right-[-8%] top-[18%] hidden h-64 w-64 animate-drift rounded-full border border-celadon/25 bg-celadon/10 blur-[2px] sm:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[12%] top-[38%] hidden h-28 w-28 animate-pulse-glow rounded-full bg-copper/30 blur-2xl sm:block"
          aria-hidden
        />
      </div>
    </section>
  );
}
