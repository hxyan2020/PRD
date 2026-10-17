import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (process.env.SKIP_DATA_REGEN === "1") {
  console.log("prebuild: skipping collection generation (SKIP_DATA_REGEN=1)");
  process.exit(0);
}

const res = spawnSync("npm", ["run", "data"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(res.status ?? 1);
