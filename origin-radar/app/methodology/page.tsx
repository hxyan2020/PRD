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
      <h2 className="font-serif text-3xl">Price zone</h2>
      <p className="text-paper/80">
        Each market gets a floor / recommended / ceiling. Floor is landed cost divided by 0.62
        (about 38% gross after freight and duty — ads and returns still come out of that). Whitespace
        recommended prices use category comps. Competitive markets shade the going average.
        Saturated markets hug the low end and are often marked tight. Generate writes the
        best-region recommended price as storefront retail.
      </p>
      <h2 className="font-serif text-3xl">Customization and overseas address</h2>
      <p className="text-paper/80">
        Every factory pack records whether the mill will do logo / color / retail-box OEM, the custom
        MOQ, whether a sample can ship to an overseas address, and how export actually works:
        factory DDP, agent DDP after EXW, or EXW-only (no overseas consignee — typical for cosmetics
        and heavy sanitary electrical).
      </p>
      <h2 className="font-serif text-3xl">Daily queue</h2>
      <p className="text-paper/80">
        /queue is the working deck: eight ranked SKUs for the UTC day. Generate sources the listing,
        Collect keeps a shortlist, Discard hides a SKU until tomorrow. State lives in the same SQLite
        file as sourced listings.
      </p>
      <h2 className="font-serif text-3xl">Generate → database → storefront</h2>
      <p className="text-paper/80">
        On any recommendation, click <strong>Generate listing</strong>. OriginRadar builds a 1688-shaped
        pack (gallery, HTML description, specifications, factory terms of use, MOQ price tiers) and
        writes it to SQLite at <code>data/storefront.sqlite</code>, with images under{" "}
        <code>public/sourced/&lt;slug&gt;/</code>. If <code>ALIBABA_1688_APP_KEY</code>,{" "}
        <code>ALIBABA_1688_APP_SECRET</code>, and <code>ALIBABA_1688_ACCESS_TOKEN</code> are set, the
        generator calls <code>alibaba.product.get</code> and overwrites title/images from the live
        offer. Export Shopify CSV from /storefront when you are ready to stand up the shop.
      </p>
    </article>
  );
}
