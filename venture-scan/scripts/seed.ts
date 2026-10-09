import { runScan } from "../lib/scanner";

const result = runScan({ source: "cli-seed" });
console.log(JSON.stringify(result, null, 2));
