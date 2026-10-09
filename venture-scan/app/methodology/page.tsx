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
          entry for the full dossier.
        </li>
        <li>
          <span className="text-foam">Match</span> — a chatbot collects skills, major, current
          business, and interested domains, then scores every idea against that profile.
        </li>
      </ol>
      <p className="mt-8 text-sm text-mist">
        Seed data covers climate, health, manufacturing, agri, edtech, mobility, martech, legal,
        food, and fintech teams across Singapore, US, Germany, Kenya, Japan, India, UK, Indonesia,
        Canada, UAE, Netherlands, and Brazil.
      </p>
    </div>
  );
}
