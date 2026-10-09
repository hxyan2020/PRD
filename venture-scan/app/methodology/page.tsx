import Link from "next/link";

export default function MethodologyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-foam">How VentureScan works</h1>
      <ol className="mt-8 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-mist">
        <li>
          <span className="text-foam">Scan</span> — ingest worldwide startup ideas and fundraising
          signals from a curated feed (pluggable for live APIs).
        </li>
        <li>
          <span className="text-foam">Store</span> — normalize each idea into SQLite with the ten
          required fields (name through go-forward play).
        </li>
        <li>
          <span className="text-foam">Surface</span> — browse and filter on the frontend; open any
          entry for the full dossier with brand/cover images extracted from related data sources,
          plus an idea chatbot that answers follow-ups and cites those desks on every reply.
        </li>
        <li>
          <span className="text-foam">Match</span> — a chatbot collects skills, major, current
          business, and interested domains, then scores every idea against that profile. If a reply
          drifts off the question, it gently steers you back before moving on.
        </li>
        <li>
          <span className="text-foam">Daily pick</span> — each day we recommend your
          highest-matched idea and list where you matched, where the gap is, and how to close it.
        </li>
        <li>
          <span className="text-foam">Collect</span> — log in with email and password, then save
          ideas plus matching analysis into your personal collection.
        </li>
        <li>
          <span className="text-foam">Languages</span> — switch the UI among major world languages
          with a flag icon language picker in the header.
        </li>
        <li>
          <span className="text-foam">Mobile</span> — sticky header + hamburger menu, larger tap
          targets, and stacked layouts tuned for phones.
        </li>
        <li>
          <span className="text-foam">Sources</span> — the{" "}
          <Link className="text-celadon underline-offset-2 hover:underline" href="/sources">
            data sources desk
          </Link>{" "}
          lists every connector, countries covered, last sourced time, and health status
          (including multilingual desks).
        </li>
        <li>
          <span className="text-foam">Permanent URL</span> — published at{" "}
          <a
            className="text-celadon underline-offset-2 hover:underline"
            href="https://hxyan2020.github.io/PRD/venture-scan/"
          >
            hxyan2020.github.io/PRD/venture-scan/
          </a>
          .
        </li>
      </ol>
      <p className="mt-8 text-sm text-mist">
        Seed data covers climate, health, manufacturing, agri, edtech, mobility, martech, legal,
        food, energy, cyber, and fintech teams across Singapore, US, Germany, Kenya, Japan, India,
        UK, Indonesia, Canada, UAE, Netherlands, Brazil, Australia, South Korea, France, Mexico,
        South Africa, Sweden, Vietnam, and Israel.
      </p>
    </div>
  );
}
