import { runScan } from "../lib/scanner";

const result = runScan({ source: "cli-scan" });
console.log(JSON.stringify(result, null, 2));
