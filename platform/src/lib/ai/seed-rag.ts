import type Database from "better-sqlite3";
import { SEED_RAG_DOCS } from "@/lib/ai/rag-corpus";

const MACRO_EVENTS = [
  {
    event_code: "USD-CPI-2026-09",
    title: "US CPI release — hotter than expected",
    event_time: "2026-09-30T12:30:00Z",
    impact: "HIGH",
    currencies: ["USD"],
    instruments: ["XAUUSD", "XAUUSD247", "NAS100", "SP500", "EURUSD"],
    description:
      "US CPI printed above consensus, USD strengthened then reversed; gold and US indices saw elevated volatility into the US session open. Historically correlates with margin utilisation spikes on gold/index CFDs.",
    source_url: "https://www.investing.com/economic-calendar/",
  },
  {
    event_code: "FOMC-2026-09",
    title: "FOMC rate decision & press conference",
    event_time: "2026-09-17T18:00:00Z",
    impact: "HIGH",
    currencies: ["USD"],
    instruments: ["XAUUSD", "USDJPY", "NAS100"],
    description:
      "FOMC hold with hawkish guidance. Spreads widened on USD majors and gold for ~15 minutes post-release.",
    source_url: "https://www.federalreserve.gov/",
  },
  {
    event_code: "BTC-ETF-FLOW-2026-10",
    title: "Spot BTC ETF outflow day",
    event_time: "2026-10-01T14:00:00Z",
    impact: "MEDIUM",
    currencies: ["USD"],
    instruments: ["BTCUSD", "ETHUSD"],
    description:
      "Reported spot BTC ETF net outflows pressured crypto prices; watch liquidation backlog and hot wallet float if withdrawal queues build.",
    source_url: "https://www.coingecko.com/",
  },
];

export function reindexRagFts(db: Database.Database) {
  db.exec(`DELETE FROM rag_fts`);
  const rows = db
    .prepare(`SELECT id, title, content, tags_json FROM rag_documents WHERE status = 'ACTIVE'`)
    .all() as Array<{ id: number; title: string; content: string; tags_json: string }>;
  const fts = db.prepare(`INSERT INTO rag_fts (rowid, title, content, tags) VALUES (?, ?, ?, ?)`);
  for (const r of rows) {
    const tags = (JSON.parse(r.tags_json) as string[]).join(" ");
    fts.run(r.id, r.title, r.content, tags);
  }
}

/** Upsert the seeded corpus so new docs land on existing SQLite files. */
export function ensureRagCorpus(db: Database.Database) {
  const upsert = db.prepare(
    `INSERT INTO rag_documents (doc_key, title, category, product_scope, content, source_ref, tags_json)
     VALUES (@doc_key, @title, @category, @product_scope, @content, @source_ref, @tags_json)
     ON CONFLICT(doc_key) DO UPDATE SET
       title = excluded.title,
       category = excluded.category,
       product_scope = excluded.product_scope,
       content = excluded.content,
       source_ref = excluded.source_ref,
       tags_json = excluded.tags_json,
       version = version + 1,
       updated_at = datetime('now')`
  );
  const tx = db.transaction(() => {
    for (const d of SEED_RAG_DOCS) {
      upsert.run({
        doc_key: d.doc_key,
        title: d.title,
        category: d.category,
        product_scope: d.product_scope,
        content: d.content,
        source_ref: d.source_ref,
        tags_json: JSON.stringify(d.tags),
      });
    }
  });
  tx();
  reindexRagFts(db);
}

function seedMacroEventsIfEmpty(db: Database.Database) {
  const insertEvent = db.prepare(
    `INSERT INTO external_macro_events
      (event_code, title, event_time, impact, currencies_json, instruments_json, description, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(event_code) DO NOTHING`
  );
  // Avoid count-then-insert races across Next static export workers.
  const tx = db.transaction(() => {
    for (const e of MACRO_EVENTS) {
      insertEvent.run(
        e.event_code,
        e.title,
        e.event_time,
        e.impact,
        JSON.stringify(e.currencies),
        JSON.stringify(e.instruments),
        e.description,
        e.source_url
      );
    }
  });
  tx();
}

export function seedRagIfEmpty(db: Database.Database) {
  ensureRagCorpus(db);
  seedMacroEventsIfEmpty(db);
}
