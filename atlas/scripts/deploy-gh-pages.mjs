/**
 * Builds Ludus Atlas for GitHub Pages and publishes to origin/gh-pages under /ludus-atlas/.
 * Permanent URL: https://hxyan2020.github.io/PRD/ludus-atlas/
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(import.meta.dirname, "..");
const repoRoot = join(root, "..");
const dist = join(root, "dist");
const worktree = join("/tmp", `ludus-atlas-gh-pages-${process.pid}`);
const target = join(worktree, "ludus-atlas");
const permanentUrl = "https://hxyan2020.github.io/PRD/ludus-atlas/";

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

run("git", ["add", "ludus-atlas"], worktree);
const status = spawnSync("git", ["status", "--porcelain"], {
  cwd: worktree,
  encoding: "utf8",
});
if (!status.stdout.trim()) {
  console.log("No changes to publish.");
} else {
  run(
    "git",
    [
      "commit",
      "-m",
      "Deploy Ludus Atlas to GitHub Pages (/ludus-atlas)",
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
