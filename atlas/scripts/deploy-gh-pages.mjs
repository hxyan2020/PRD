/**
 * Builds Ludus Atlas for GitHub Pages and publishes under /ludus-atlas/ only.
 * Permanent URL: https://hxyan2020.github.io/PRD/ludus-atlas/
 *
 * IMPORTANT: This repo’s gh-pages root hosts MatchingManagement and other sibling
 * apps (crmp-admin, venture-scan, …). Never orphan-replace the whole branch —
 * only add/update the `ludus-atlas/` folder so siblings stay live.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(import.meta.dirname, "..");
const repoRoot = join(root, "..");
const dist = join(root, "dist");
const worktree = join("/tmp", `ludus-atlas-gh-pages-${process.pid}`);
const target = join(worktree, "ludus-atlas");
const permanentUrl = "https://hxyan2020.github.io/PRD/ludus-atlas/";

/**
 * Root MatchingManagement SPA must remain. Other sibling folders are optional —
 * MatchingManagement orphan deploys sometimes wipe them; we still restore
 * ludus-atlas/ alongside whatever is left.
 */
const REQUIRED_ROOT = ["index.html", "assets"];
const OPTIONAL_SIBLINGS = ["crmp-admin", "venture-scan", "risk-discovery"];

function run(cmd, args, cwd = root, env = process.env) {
  const res = spawnSync(cmd, args, {
    cwd,
    env,
    stdio: "inherit",
    encoding: "utf8",
  });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${res.status})`);
  }
}

function assertRootSpaIntact() {
  const missing = REQUIRED_ROOT.filter((rel) => !existsSync(join(worktree, rel)));
  if (missing.length) {
    throw new Error(
      `Refusing to push: MatchingManagement root missing (${missing.join(", ")}).`,
    );
  }
  const gone = OPTIONAL_SIBLINGS.filter((rel) => !existsSync(join(worktree, rel)));
  if (gone.length) {
    console.warn(
      `Note: optional sibling Pages folders missing (${gone.join(", ")}); ` +
        "continuing with ludus-atlas restore only.",
    );
  }
  const rootHtml = readFileSync(join(worktree, "index.html"), "utf8");
  if (!/MatchingManagement/i.test(rootHtml)) {
    console.warn(
      "Warning: root index.html does not look like MatchingManagement; leaving it untouched.",
    );
  }
}

console.log("Building for GitHub Pages…");
run("npm", ["run", "build"], root, { ...process.env, GITHUB_PAGES: "1" });

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("Build missing dist/index.html");
}

console.log("Preparing gh-pages worktree…");
rmSync(worktree, { recursive: true, force: true });
run("git", ["fetch", "origin", "gh-pages"], repoRoot);
run(
  "git",
  ["worktree", "add", "--detach", worktree, "origin/gh-pages"],
  repoRoot,
);

// Only replace ludus-atlas/ — never delete MatchingManagement at repo root.
assertRootSpaIntact();

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(dist, target, { recursive: true });
// SPA fallback for direct refresh under this folder when possible
cpSync(join(dist, "index.html"), join(target, "404.html"));
writeFileSync(join(target, ".nojekyll"), "");
writeFileSync(
  join(target, "CNAME.txt"),
  `# Published path (not a DNS CNAME): ${permanentUrl}\n`,
);

assertRootSpaIntact();
if (!existsSync(join(target, "index.html"))) {
  throw new Error("ludus-atlas/index.html missing after copy");
}

run("git", ["add", "ludus-atlas"], worktree);
const status = spawnSync("git", ["status", "--porcelain"], {
  cwd: worktree,
  encoding: "utf8",
});
if (!status.stdout.trim()) {
  console.log("No changes to publish.");
} else {
  // Guard: staged paths must stay under ludus-atlas/
  const staged = spawnSync("git", ["diff", "--cached", "--name-only"], {
    cwd: worktree,
    encoding: "utf8",
  });
  const bad = (staged.stdout || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !p.startsWith("ludus-atlas/"));
  if (bad.length) {
    throw new Error(
      `Refusing to commit non-ludus-atlas paths: ${bad.slice(0, 8).join(", ")}`,
    );
  }

  run(
    "git",
    [
      "commit",
      "-m",
      "Restore Ludus Atlas on GitHub Pages (/ludus-atlas)",
    ],
    worktree,
  );
  // Push with retries
  let pushed = false;
  let delay = 4000;
  for (let i = 0; i < 5 && !pushed; i++) {
    const push = spawnSync(
      "git",
      ["push", "origin", "HEAD:gh-pages"],
      { cwd: worktree, encoding: "utf8", stdio: "inherit" },
    );
    if (push.status === 0) {
      pushed = true;
      break;
    }
    console.warn(`Push failed (attempt ${i + 1}); retrying in ${delay}ms…`);
    spawnSync("sleep", [String(delay / 1000)]);
    delay *= 2;
  }
  if (!pushed) throw new Error("Failed to push gh-pages");
}

run("git", ["worktree", "remove", "--force", worktree], repoRoot);
console.log("Live permanent link:", permanentUrl);
console.log(
  "Note: https://hxyan2020.github.io/PRD/ is MatchingManagement — Ludus Atlas lives only under /ludus-atlas/.",
);
