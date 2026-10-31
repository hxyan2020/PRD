import type Database from "better-sqlite3";
import { getDb } from "@/lib/db";
import {
  HIDDEN_TABLE_PREFIXES,
  SQL_MAX_ROWS,
  assertReadOnlySql,
  maskSensitiveRows,
  type SqlColumn,
  type SqlQueryResult,
  type SqlTableInfo,
} from "@/lib/sql-explorer-shared";

export {
  SAMPLE_QUERIES,
  SQL_MAX_ROWS,
  SQL_STATEMENT_MAX_CHARS,
  assertReadOnlySql,
  stripSqlComments,
  maskSensitiveRows,
  type SqlColumn,
  type SqlQueryResult,
  type SqlTableInfo,
} from "@/lib/sql-explorer-shared";

export function listSimulatedTables(db: Database.Database = getDb()): SqlTableInfo[] {
  const masters = db
    .prepare(
      `SELECT name, type, sql FROM sqlite_master
       WHERE type IN ('table','view')
         AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
    )
    .all() as Array<{ name: string; type: "table" | "view"; sql: string | null }>;

  return masters
    .filter((m) => !HIDDEN_TABLE_PREFIXES.some((p) => m.name.startsWith(p) && m.name !== "rag_fts"))
    .map((m) => {
      let rowCount = 0;
      try {
        rowCount = (db.prepare(`SELECT COUNT(*) AS c FROM "${m.name.replace(/"/g, '""')}"`).get() as { c: number }).c;
      } catch {
        rowCount = 0;
      }
      const columns = db.prepare(`PRAGMA table_info("${m.name.replace(/"/g, '""')}")`).all() as SqlColumn[];
      return {
        name: m.name,
        type: m.type,
        rowCount,
        columns,
        createSql: m.sql,
      };
    });
}

export function runReadOnlySql(rawSql: string, db: Database.Database = getDb()): SqlQueryResult {
  const sql = assertReadOnlySql(rawSql);
  const started = Date.now();
  const stmt = db.prepare(sql);
  if (stmt.reader) {
    const rawRows = stmt.all() as Array<Record<string, unknown>>;
    const truncated = rawRows.length > SQL_MAX_ROWS;
    const slice = truncated ? rawRows.slice(0, SQL_MAX_ROWS) : rawRows;
    const columns = slice.length ? Object.keys(slice[0]) : stmt.columns().map((c) => c.name);
    return {
      columns,
      rows: maskSensitiveRows(columns, slice),
      rowCount: slice.length,
      truncated,
      ms: Date.now() - started,
      sql,
    };
  }
  stmt.run();
  return {
    columns: [],
    rows: [],
    rowCount: 0,
    truncated: false,
    ms: Date.now() - started,
    sql,
  };
}
