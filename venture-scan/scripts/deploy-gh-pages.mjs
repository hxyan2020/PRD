/**
 * Builds VentureScan and publishes to origin/gh-pages under /venture-scan/.
 * Permanent URL: https://hxyan2020.github.io/PRD/venture-scan/
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(import.meta.dirname, "..");
const repoRoot = join(root, "..");
const out = join(root, "out");
const worktree = join("/tmp", `venture-scan-gh-pages-${process.pid}`);
const target = join(worktree, "venture-scan");
const permanentUrl = "https://hxyan2020.github.io/PRD/venture-scan/";

function run(cmd, args, cwd, env = process.env) {
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit", encoding: "utf8", env });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${res.status})`);
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

console.log("Building static export for GitHub Pages…");
run(
  "npm",
  ["run", "build:static"],
  root,
  {
    ...process.env,
    BASE_PATH: "/PRD/venture-scan",
    NEXT_PUBLIC_BASE_PATH: "/PRD/venture-scan",
    STATIC_EXPORT: "1",
    NEXT_PUBLIC_STATIC: "1",
  },
);

if (!existsSync(join(out, "index.html"))) {
  throw new Error("Build missing out/index.html");
}

console.log("Preparing gh-pages worktree…");
rmSync(worktree, { recursive: true, force: true });
run("git", ["fetch", "origin", "gh-pages"], repoRoot);
run("git", ["worktree", "prune"], repoRoot);
run("git", ["worktree", "add", "--detach", worktree, "origin/gh-pages"], repoRoot);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(out, target, { recursive: true });
if (existsSync(join(out, "404.html"))) {
  cpSync(join(out, "404.html"), join(target, "404.html"));
} else {
  cpSync(join(out, "index.html"), join(target, "404.html"));
}
writeFileSync(join(target, ".nojekyll"), "");
writeFileSync(join(target, "PUBLIC_URL.txt"), `${permanentUrl}\n`);

run("git", ["add", "venture-scan"], worktree);
const status = spawnSync("git", ["status", "--porcelain"], {
  cwd: worktree,
  encoding: "utf8",
});

if (!status.stdout.trim()) {
  console.log("No changes to publish.");
} else {
  run(
    "git",
    ["commit", "-m", "Deploy VentureScan to GitHub Pages (/venture-scan)"],
    worktree,
  );

  let pushed = false;
  let delay = 4000;
  for (let i = 0; i < 5 && !pushed; i++) {
    const push = spawnSync("git", ["push", "origin", "HEAD:gh-pages"], {
      cwd: worktree,
      stdio: "inherit",
      encoding: "utf8",
    });
    if (push.status === 0) {
      pushed = true;
    } else {
      console.warn(`Push failed (attempt ${i + 1}), retrying in ${delay}ms…`);
      sleep(delay);
      delay *= 2;
    }
  }
  if (!pushed) throw new Error("Failed to push gh-pages");
  console.log(`Deployed to ${permanentUrl}`);
}

run("git", ["worktree", "remove", "--force", worktree], repoRoot);
