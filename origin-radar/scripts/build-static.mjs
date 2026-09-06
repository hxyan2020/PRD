import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(app);

const api = "app/api";
const parkDir = ".static-park";
const parkApi = path.join(parkDir, "api");

mkdirSync(parkDir, { recursive: true });
if (existsSync(api)) renameSync(api, parkApi);

const env = {
  ...process.env,
  STATIC_EXPORT: "1",
  NEXT_TELEMETRY_DISABLED: "1",
};
if (process.env.BASE_PATH) {
  env.BASE_PATH = process.env.BASE_PATH;
  env.NEXT_PUBLIC_BASE_PATH = process.env.BASE_PATH;
}

let status = 1;
try {
  const r = spawnSync("npx", ["next", "build"], { stdio: "inherit", env });
  status = r.status ?? 1;
  if (status === 0 && existsSync("out")) {
    writeFileSync(path.join("out", ".nojekyll"), "");
  }
} finally {
  if (existsSync(parkApi)) renameSync(parkApi, api);
}

process.exit(status);
