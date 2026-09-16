import { SourceHealth } from "@/components/SourceHealth";
import { loadBriefing } from "@/lib/loadData";

export default async function SourcesPage() {
  const briefing = await loadBriefing();

  if (!briefing) {
    return <p className="text-muted">No source health yet. Run `npm run scan`.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-3xl">Data sources & health</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Every feed used by the daily scanner, with last-sourced time, HTTP
          status, latency, items fetched, items inside the current window, and
          health: healthy (parsed with dated items), degraded (reachable but
          empty/unusable), or down (timeout, HTTP error, or parse failure).
        </p>
      </div>
      <SourceHealth sources={briefing.sources} />
    </div>
  );
}
