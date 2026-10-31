"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Play, RefreshCw, Table2 } from "lucide-react";
import { useUiLocale } from "@/hooks/useUiLocale";
import { EnZh } from "@/components/EnZh";
import { Badge } from "@/components/ui";
import { isPublicSnapshot, publicApiPath, publicBasePath } from "@/lib/static-export";
import {
  SAMPLE_QUERIES,
  SQL_MAX_ROWS,
  assertReadOnlySql,
  maskSensitiveRows,
  type SqlQueryResult,
  type SqlTableInfo,
} from "@/lib/sql-explorer-shared";

type CatalogResponse = {
  db: string;
  readOnly: boolean;
  tableCount: number;
  tables: SqlTableInfo[];
  samples: typeof SAMPLE_QUERIES;
};

type SqlJsDatabase = {
  exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
  close: () => void;
};

function demoDbUrl() {
  const base = publicBasePath();
  return `${base}/data/vantage_risk.demo.db`;
}

function wasmLocate(file: string) {
  const base = publicBasePath();
  return `${base}/sql-wasm/${file}`;
}

function runOnSqlJs(db: SqlJsDatabase, rawSql: string): SqlQueryResult {
  const sql = assertReadOnlySql(rawSql);
  const started = Date.now();
  const parts = db.exec(sql);
  if (!parts.length) {
    return { columns: [], rows: [], rowCount: 0, truncated: false, ms: Date.now() - started, sql };
  }
  const { columns, values } = parts[0];
  const truncated = values.length > SQL_MAX_ROWS;
  const slice = truncated ? values.slice(0, SQL_MAX_ROWS) : values;
  const rows = slice.map((vals) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      row[col] = vals[i];
    });
    return row;
  });
  return {
    columns,
    rows: maskSensitiveRows(columns, rows),
    rowCount: rows.length,
    truncated,
    ms: Date.now() - started,
    sql,
  };
}

function buildCatalogFromSqlJs(db: SqlJsDatabase): SqlTableInfo[] {
  const masters = db.exec(
    `SELECT name, type, sql FROM sqlite_master
     WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'
     ORDER BY name`
  );
  if (!masters.length) return [];
  const rows = masters[0].values as Array<[string, string, string | null]>;
  return rows
    .filter(([name]) => !(name.startsWith("rag_fts_") && name !== "rag_fts"))
    .map(([name, type, createSql]) => {
      let rowCount = 0;
      try {
        const c = db.exec(`SELECT COUNT(*) AS c FROM "${name.replace(/"/g, '""')}"`);
        rowCount = Number(c[0]?.values?.[0]?.[0] ?? 0);
      } catch {
        rowCount = 0;
      }
      let columns: SqlTableInfo["columns"] = [];
      try {
        const info = db.exec(`PRAGMA table_info("${name.replace(/"/g, '""')}")`);
        columns = (info[0]?.values || []).map((v) => ({
          cid: Number(v[0]),
          name: String(v[1]),
          type: String(v[2] || ""),
          notnull: Number(v[3] || 0),
          dflt_value: (v[4] as string | null) ?? null,
          pk: Number(v[5] || 0),
        }));
      } catch {
        columns = [];
      }
      return {
        name,
        type: type === "view" ? "view" : "table",
        rowCount,
        columns,
        createSql,
      };
    });
}

export function SimulatedDataBoard() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const publicMode = isPublicSnapshot();

  const [tables, setTables] = useState<SqlTableInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sql, setSql] = useState(SAMPLE_QUERIES[0].sql);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [modeLabel, setModeLabel] = useState(publicMode ? "sql.js" : "live");
  const [filter, setFilter] = useState("");
  const [sqlJsDb, setSqlJsDb] = useState<SqlJsDatabase | null>(null);

  const loadLiveCatalog = useCallback(async () => {
    const res = await fetch(publicApiPath("/api/sql?action=catalog"), { credentials: "include" });
    if (!res.ok) throw new Error(zh ? "無法載入資料目錄" : "Failed to load catalog");
    const data = (await res.json()) as CatalogResponse;
    setTables(data.tables);
    setSelected((prev) => prev || data.tables[0]?.name || null);
    setModeLabel("live SQLite");
  }, [zh]);

  const loadSqlJs = useCallback(async () => {
    const initSqlJs = (await import("sql.js")).default;
    const SQL = await initSqlJs({ locateFile: wasmLocate });
    const buf = await fetch(demoDbUrl()).then((r) => {
      if (!r.ok) throw new Error(zh ? "找不到示範資料庫快照" : "Demo database snapshot missing");
      return r.arrayBuffer();
    });
    const db = new SQL.Database(new Uint8Array(buf)) as unknown as SqlJsDatabase;
    setSqlJsDb(db);
    const catalog = buildCatalogFromSqlJs(db);
    setTables(catalog);
    setSelected((prev) => prev || catalog[0]?.name || null);
    setModeLabel("sql.js snapshot");
  }, [zh]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (publicMode) await loadSqlJs();
      else {
        try {
          await loadLiveCatalog();
        } catch {
          await loadSqlJs();
        }
      }
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }, [publicMode, loadLiveCatalog, loadSqlJs]);

  useEffect(() => {
    void refresh();
    return () => {
      sqlJsDb?.close?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  const selectedTable = useMemo(
    () => tables.find((t) => t.name === selected) || null,
    [tables, selected]
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [tables, filter]);

  function previewTable(name: string) {
    setSelected(name);
    setSql(`SELECT * FROM "${name.replace(/"/g, '""')}" LIMIT 50;`);
  }

  async function runSql(nextSql = sql) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      if (sqlJsDb) {
        setResult(runOnSqlJs(sqlJsDb, nextSql));
      } else if (!publicMode) {
        const res = await fetch(publicApiPath("/api/sql"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql: nextSql }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Query failed");
        setResult(data as SqlQueryResult);
      } else {
        throw new Error(zh ? "示範資料庫尚未就緒" : "Demo database not ready");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4 border-teal-200 bg-teal-50/60 text-sm text-teal-950">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 font-semibold">
              <Database className="h-4 w-4" aria-hidden />
              <EnZh en="Simulated CRMP SQLite seed" zh="CRMP 模擬 SQLite 種子資料" />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-teal-900/80">
              <EnZh
                en={`Browse every seeded table/schema and run read-only SQL. Writes are blocked. Results cap at ${SQL_MAX_ROWS} rows. Passwords/secrets are masked.`}
                zh={`瀏覽所有種子資料表／結構，並執行唯讀 SQL。寫入已封鎖。結果最多 ${SQL_MAX_ROWS} 列。密碼／密鑰會遮罩。`}
              />
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-teal-100 text-teal-900 border-teal-200">{modeLabel}</Badge>
            <button type="button" className="btn btn-sm" onClick={() => void refresh()} disabled={busy}>
              <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} aria-hidden />
              <EnZh en="Reload" zh="重新載入" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-teal-800/80 break-all">
          <EnZh en="Source" zh="來源" />: platform/data/vantage_risk.db
          {publicMode ? " → public/data/vantage_risk.demo.db" : ""}
        </p>
      </div>

      {error && !result ? (
        <div className="panel p-3 text-sm text-red-800 bg-red-50 border-red-200">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-3 sm:gap-4">
        <aside className="panel p-3 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-semibold text-sm inline-flex items-center gap-1.5">
              <Table2 className="h-4 w-4" aria-hidden />
              <EnZh en="Tables" zh="資料表" />
            </h2>
            <span className="text-[11px] text-[var(--muted)]">{ready ? tables.length : "…"}</span>
          </div>
          <input
            className="input w-full text-sm mb-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={zh ? "搜尋資料表／欄位…" : "Filter tables / columns…"}
          />
          <ul className="max-h-[28rem] overflow-auto divide-y divide-[var(--border)]">
            {filtered.map((t) => {
              const active = t.name === selected;
              return (
                <li key={t.name}>
                  <button
                    type="button"
                    className={`w-full text-left px-2 py-2 text-sm hover:bg-teal-50 ${
                      active ? "bg-teal-50 text-teal-950" : ""
                    }`}
                    onClick={() => previewTable(t.name)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] truncate">{t.name}</span>
                      <span className="text-[10px] text-[var(--muted)] shrink-0">{t.rowCount}</span>
                    </div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5 uppercase tracking-wide">
                      {t.type}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="space-y-3 min-w-0">
          {selectedTable ? (
            <section className="panel p-3 sm:p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold font-mono text-sm sm:text-base">{selectedTable.name}</h2>
                <span className="text-xs text-[var(--muted)]">
                  {selectedTable.rowCount} <EnZh en="rows" zh="列" /> · {selectedTable.columns.length}{" "}
                  <EnZh en="columns" zh="欄" />
                </span>
              </div>
              <div className="mt-3 overflow-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="py-1.5 pr-3 font-medium">#</th>
                      <th className="py-1.5 pr-3 font-medium">
                        <EnZh en="Column" zh="欄位" />
                      </th>
                      <th className="py-1.5 pr-3 font-medium">
                        <EnZh en="Type" zh="型別" />
                      </th>
                      <th className="py-1.5 pr-3 font-medium">PK</th>
                      <th className="py-1.5 pr-3 font-medium">NOT NULL</th>
                      <th className="py-1.5 font-medium">
                        <EnZh en="Default" zh="預設" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.columns.map((c) => (
                      <tr key={c.name} className="border-b border-[var(--border)]/60">
                        <td className="py-1.5 pr-3 text-[var(--muted)]">{c.cid}</td>
                        <td className="py-1.5 pr-3 font-mono">{c.name}</td>
                        <td className="py-1.5 pr-3">{c.type || "—"}</td>
                        <td className="py-1.5 pr-3">{c.pk ? "✓" : ""}</td>
                        <td className="py-1.5 pr-3">{c.notnull ? "✓" : ""}</td>
                        <td className="py-1.5 font-mono text-[11px]">{c.dflt_value ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedTable.createSql ? (
                <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-slate-950 text-slate-100 text-[11px] p-3 whitespace-pre-wrap">
                  {selectedTable.createSql}
                </pre>
              ) : null}
            </section>
          ) : null}

          <section className="panel p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUERIES.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setSql(q.sql);
                    void runSql(q.sql);
                  }}
                >
                  {zh ? q["zh-Hant"] : q.en}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                <EnZh en="SQL (read-only)" zh="SQL（唯讀）" />
              </span>
              <textarea
                className="input mt-1 w-full font-mono text-xs sm:text-sm min-h-[8rem]"
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                spellCheck={false}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !ready}
                onClick={() => void runSql()}
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                <EnZh en="Run query" zh="執行查詢" />
              </button>
              {result ? (
                <span className="text-xs text-[var(--muted)]">
                  {result.rowCount} <EnZh en="rows" zh="列" /> · {result.ms} ms
                  {result.truncated ? (zh ? " · 已截斷" : " · truncated") : ""}
                </span>
              ) : null}
            </div>
            {error && result === null ? null : error ? (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            ) : null}
            {result ? (
              <div className="overflow-auto max-h-[28rem] border border-[var(--border)] rounded-md">
                {result.columns.length === 0 ? (
                  <p className="p-3 text-sm text-[var(--muted)]">
                    <EnZh en="Query returned no columns." zh="查詢沒有回傳欄位。" />
                  </p>
                ) : (
                  <table className="min-w-full text-xs">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left border-b border-[var(--border)]">
                        {result.columns.map((c) => (
                          <th key={c} className="px-2 py-1.5 font-medium whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border)]/50 align-top">
                          {result.columns.map((c) => (
                            <td key={c} className="px-2 py-1.5 font-mono whitespace-pre-wrap max-w-[20rem]">
                              {formatCell(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "NULL";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
