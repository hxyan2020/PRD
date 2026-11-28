import { ensureCatalogueFresh, runWorldwideScan } from "../lib/scanner";

const force = process.argv.includes("--force");
const result = force
  ? await runWorldwideScan({ force: true, source: "cli-scan" })
  : (await ensureCatalogueFresh()).scan;

console.log(JSON.stringify(result, null, 2));
