#!/usr/bin/env bash
# Ensure the seeded SQLite DB exists and copy a read-only snapshot + sql.js WASM
# into public/ for the Docs → Simulated Data / SQL explorer (incl. GitHub Pages).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p public/data public/sql-wasm data

# Ensure seed exists (getDb via a tiny tsx probe)
npx tsx -e "
import { getDb } from './src/lib/db.ts';
import { listSimulatedTables } from './src/lib/sql-explorer.ts';
const db = getDb();
const tables = listSimulatedTables(db);
console.log('seeded_tables', tables.length);
"

# Checkpoint WAL into the main file before copying (quote PRAGMA so bash
# does not treat (FULL) as a subshell).
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 data/vantage_risk.db 'PRAGMA wal_checkpoint(FULL);' || true
fi

cp -f data/vantage_risk.db public/data/vantage_risk.demo.db
# sql.js browser WASM + glue used by SimulatedDataBoard
cp -f node_modules/sql.js/dist/sql-wasm.wasm public/sql-wasm/sql-wasm.wasm
cp -f node_modules/sql.js/dist/sql-wasm.js public/sql-wasm/sql-wasm.js

ls -lh public/data/vantage_risk.demo.db public/sql-wasm/sql-wasm.wasm
echo "Demo DB + sql.js WASM ready under public/"
