import type Database from "better-sqlite3";

export type RagHit = {
  id: number;
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
  content: string;
  source_ref: string | null;
  tags_json: string;
  score: number;
};

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9%\-\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** Hybrid retrieval: FTS5 when possible, else keyword overlap scoring. */
export function retrieveRag(db: Database.Database, query: string, limit = 5): RagHit[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  // Prefer FTS
  try {
    const ftsQuery = tokens.map((t) => `"${t.replace(/"/g, "")}"`).join(" OR ");
    const rows = db
      .prepare(
        `SELECT d.*, bm25(rag_fts) AS rank
         FROM rag_fts
         JOIN rag_documents d ON d.id = rag_fts.rowid
         WHERE rag_fts MATCH ? AND d.status = 'ACTIVE'
         ORDER BY rank
         LIMIT ?`
      )
      .all(ftsQuery, limit) as Array<RagHit & { rank: number }>;
    if (rows.length) {
      return rows.map((r) => ({
        ...r,
        score: Math.max(0.1, Math.min(0.99, 1 / (1 + Math.abs(r.rank)))),
      }));
    }
  } catch {
    // fall through to keyword
  }

  const docs = db
    .prepare(`SELECT * FROM rag_documents WHERE status = 'ACTIVE'`)
    .all() as Array<Omit<RagHit, "score">>;

  const scored = docs
    .map((d) => {
      const hay = `${d.title} ${d.content} ${d.tags_json}`.toLowerCase();
      let hits = 0;
      for (const t of tokens) if (hay.includes(t)) hits += 1;
      return { ...d, score: hits / tokens.length };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function listRagDocuments(
  db: Database.Database,
  opts: { q?: string; category?: string; status?: string } = {}
) {
  if (opts.q) {
    return retrieveRag(db, opts.q, 50).filter((d) => {
      if (opts.category && d.category !== opts.category) return false;
      return true;
    });
  }
  let sql = `SELECT *, 1.0 AS score FROM rag_documents WHERE 1=1`;
  const params: string[] = [];
  if (opts.category) {
    sql += ` AND category = ?`;
    params.push(opts.category);
  }
  if (opts.status) {
    sql += ` AND status = ?`;
    params.push(opts.status);
  }
  sql += ` ORDER BY category, title`;
  return db.prepare(sql).all(...params) as RagHit[];
}

export function upsertRagDocument(
  db: Database.Database,
  doc: {
    id?: number;
    doc_key: string;
    title: string;
    category: string;
    product_scope: string;
    content: string;
    source_ref?: string;
    tags?: string[];
    status?: string;
  }
) {
  const tags = JSON.stringify(doc.tags ?? []);
  if (doc.id) {
    db.prepare(
      `UPDATE rag_documents
       SET title = ?, category = ?, product_scope = ?, content = ?, source_ref = ?,
           tags_json = ?, status = COALESCE(?, status), version = version + 1,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      doc.title,
      doc.category,
      doc.product_scope,
      doc.content,
      doc.source_ref ?? null,
      tags,
      doc.status ?? null,
      doc.id
    );
    db.prepare(`DELETE FROM rag_fts WHERE rowid = ?`).run(doc.id);
    if ((doc.status ?? "ACTIVE") === "ACTIVE") {
      db.prepare(`INSERT INTO rag_fts (rowid, title, content, tags) VALUES (?, ?, ?, ?)`).run(
        doc.id,
        doc.title,
        doc.content,
        (doc.tags ?? []).join(" ")
      );
    }
    return doc.id;
  }

  const info = db
    .prepare(
      `INSERT INTO rag_documents (doc_key, title, category, product_scope, content, source_ref, tags_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      doc.doc_key,
      doc.title,
      doc.category,
      doc.product_scope,
      doc.content,
      doc.source_ref ?? null,
      tags,
      doc.status ?? "ACTIVE"
    );
  const id = Number(info.lastInsertRowid);
  db.prepare(`INSERT INTO rag_fts (rowid, title, content, tags) VALUES (?, ?, ?, ?)`).run(
    id,
    doc.title,
    doc.content,
    (doc.tags ?? []).join(" ")
  );
  return id;
}
