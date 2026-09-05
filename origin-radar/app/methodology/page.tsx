export default function MethodPage() {
  return (
    <article className="prose-invert max-w-3xl space-y-6">
      <p className="kicker">How the desk works</p>
      <h1 className="font-serif text-5xl">Scoring, sources, and what “whitespace” means</h1>
      <p className="text-lg leading-relaxed text-paper/80">
        OriginRadar is an opportunity desk, not a store. Each card is a SKU that is moving in
        China factory channels, then tested against demand (search + social) and against whether
        North America, Southeast Asia, and Europe already sell a comparable item.
      </p>
      <h2 className="font-serif text-3xl">Opportunity score (0–100)</h2>
      <ul className="list-disc space-y-2 pl-5 text-paper/80">
        <li>
          <strong>Factory trend 20%</strong> — 1688/PDD order volume, listing depth, week-on-week
          velocity.
        </li>
        <li>
          <strong>Social heat 20%</strong> — TikTok, Xiaohongshu, Instagram, YouTube, X mentions and
          views, with a rising/peak/fading modifier.
        </li>
        <li>
          <strong>Search demand 18%</strong> — Google keyword index, related-query lift, and average
          interest across NA / SEA / EU countries.
        </li>
        <li>
          <strong>Market gap 28%</strong> — whitespace scores 100. If the product exists, score
          scales with factory-to-retail margin and listing thinness.
        </li>
        <li>
          <strong>Supply ease 14%</strong> — supplier count, verified factories, MOQ.
        </li>
      </ul>
      <h2 className="font-serif text-3xl">Price gap</h2>
      <p className="text-paper/80">
        Margin % = (regional average retail − estimated landed cost) / retail. Landed cost is
        factory unit + typical DDP/postage + a duty buffer. Whitespace cells use a projected retail
        from category comps so you still see a theoretical gap.
      </p>
      <h2 className="font-serif text-3xl">Sources</h2>
      <p className="text-paper/80">
        Factory layer: 1688, Pinduoduo, Alibaba, Taobao. Demand layer: Google search interest,
        TikTok, Xiaohongshu (小红书), Instagram, YouTube, X. Market layer: Amazon US/EU, Walmart,
        Shopify/DTC, Shopee, Lazada, TikTok Shop, and regional specialists (Bol, Notino, Leroy
        Merlin).
      </p>
      <p className="text-paper/80">
        Official 1688, TikTok Creative Center, and Xiaohongshu APIs need commercial keys. The
        current snapshot is a research-backed desk as of 5 Sep 2026 with a pluggable adapter for
        live refresh. Treat numbers as directional for sourcing, not as a purchase order.
      </p>
    </article>
  );
}
