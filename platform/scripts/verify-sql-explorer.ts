import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/lib/db";
import {
  SAMPLE_QUERIES,
  assertReadOnlySql,
  listSimulatedTables,
  runReadOnlySql,
} from "../src/lib/sql-explorer";

const root = path.join(__dirname, "..");

assert.throws(() => assertReadOnlySql("DELETE FROM users"), /blocked|Only SELECT/i);
assert.throws(() => assertReadOnlySql("SELECT 1; SELECT 2"), /single/i);
assert.equal(assertReadOnlySql("SELECT 1 AS n").toUpperCase().startsWith("SELECT"), true);

const db = getDb();
const tables = listSimulatedTables(db);
assert.ok(tables.length >= 40, `expected ≥40 tables, got ${tables.length}`);
assert.ok(tables.some((t) => t.name === "monitor_indicators"));
assert.ok(tables.some((t) => t.name === "users"));

for (const sample of SAMPLE_QUERIES) {
  const result = runReadOnlySql(sample.sql, db);
  assert.ok(result.columns.length > 0 || result.rowCount === 0, sample.id);
  if (sample.id === "schema-users") {
    assert.ok(result.rows.every((r) => r.password === "***" || r.password == null), "password masked");
  }
}

const users = runReadOnlySql("SELECT email, password FROM users LIMIT 3", db);
assert.ok(users.rows.every((r) => r.password === "***"));

const nav = fs.readFileSync(path.join(root, "src/lib/nav.ts"), "utf8");
assert.match(nav, /\/admin\/docs\/simulated-data/);
assert.match(nav, /\/admin\/monitor-labs/);
assert.doesNotMatch(nav, /href: "\/admin\/l2-rca"/);
assert.doesNotMatch(nav, /href: "\/admin\/ai-incident"/);
assert.doesNotMatch(nav, /href: "\/admin\/noise-reduction"/);

const page = fs.readFileSync(path.join(root, "src/app/admin/docs/simulated-data/page.tsx"), "utf8");
assert.match(page, /SimulatedDataBoard/);

const board = fs.readFileSync(path.join(root, "src/components/SimulatedDataBoard.tsx"), "utf8");
assert.match(board, /sql-wasm-browser\.wasm/);
assert.match(board, /wasmBinary/);

const prepare = fs.readFileSync(path.join(root, "scripts/prepare-demo-db.sh"), "utf8");
assert.match(prepare, /sql-wasm-browser\.wasm/);

const home = fs.readFileSync(path.join(root, "src/app/admin/page.tsx"), "utf8");
assert.match(home, /HomeDeskFlowStrip/);
assert.doesNotMatch(home, /HomeL1L2AggregationDemo/);
assert.match(home, /href="\/admin\/alerts"/);

console.log(
  JSON.stringify(
    {
      ok: true,
      tables: tables.length,
      samples: SAMPLE_QUERIES.length,
      userRowsMasked: users.rowCount,
    },
    null,
    2
  )
);
