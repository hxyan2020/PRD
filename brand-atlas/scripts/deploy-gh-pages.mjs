/**
 * Builds Seen and publishes to origin/gh-pages under /brand-atlas/.
 * Also keeps /seen → /PRD/brand-atlas/ so short links land on Seen, not MatchingManagement.
 * Permanent URL: https://hxyan2020.github.io/PRD/brand-atlas/
 *
 * Only updates brand-atlas/ and seen/ — never replaces the gh-pages root (MatchingManagement etc.).
 * Retries against concurrent sibling deploys by re-fetching origin/gh-pages before each push.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(import.meta.dirname, "..");
const repoRoot = join(root, "..");
const dist = join(root, "dist");
const bin = (...names) => join(root, "node_modules", ".bin", ...names);
const permanentUrl = "https://hxyan2020.github.io/PRD/brand-atlas/";
const shortUrl = "https://hxyan2020.github.io/PRD/seen/";

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit", encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${res.status})`);
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeSeenRedirect(dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Seen</title>
    <meta http-equiv="refresh" content="0;url=${permanentUrl}" />
    <link rel="canonical" href="${permanentUrl}" />
    <script>
      location.replace(${JSON.stringify(permanentUrl)} + (location.search || "") + (location.hash || ""));
    </script>
  </head>
  <body>
    <p><a href="${permanentUrl}">Continue to Seen</a></p>
  </body>
</html>
`,
  );
  writeFileSync(join(dir, ".nojekyll"), "");
}

function stageSeenInto(worktree) {
  const target = join(worktree, "brand-atlas");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(dist, target, { recursive: true });
  cpSync(join(dist, "index.html"), join(target, "404.html"));
  writeFileSync(join(target, ".nojekyll"), "");
  writeFileSync(join(target, "PUBLIC_URL.txt"), `${permanentUrl}\n`);
  writeSeenRedirect(join(worktree, "seen"));
}

console.log("Building for GitHub Pages (tsc + vite; skip catalog regenerate)…");
run(bin("tsc"), ["-b"], root);
run(bin("vite"), ["build"], root);

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("Build missing dist/index.html");
}

let deployed = false;
let delay = 4000;
for (let attempt = 1; attempt <= 8 && !deployed; attempt++) {
  const worktree = join("/tmp", `brand-atlas-gh-pages-${process.pid}-${attempt}`);
  console.log(`Preparing gh-pages worktree (attempt ${attempt})…`);
  rmSync(worktree, { recursive: true, force: true });
  run("git", ["fetch", "origin", "gh-pages"], repoRoot);
  run("git", ["worktree", "prune"], repoRoot);
  run("git", ["worktree", "add", "--detach", worktree, "origin/gh-pages"], repoRoot);

  try {
    stageSeenInto(worktree);
    run("git", ["add", "brand-atlas", "seen"], worktree);

    const status = spawnSync("git", ["status", "--porcelain"], {
      cwd: worktree,
      encoding: "utf8",
    });

    if (!status.stdout.trim()) {
      console.log("No changes to publish.");
      deployed = true;
    } else {
      // Ensure we do not stage unrelated root wipes if git somehow marks them.
      const porcelain = status.stdout
        .trim()
        .split("\n")
        .filter(Boolean);
      const unexpected = porcelain.filter((line) => {
        const path = line.slice(3).trim();
        return !path.startsWith("brand-atlas") && !path.startsWith("seen");
      });
      if (unexpected.length) {
        throw new Error(
          `Refusing to publish unexpected gh-pages paths:\n${unexpected.join("\n")}`,
        );
      }

      run(
        "git",
        [
          "commit",
          "-m",
          "Deploy Seen brand-atlas to GitHub Pages (/brand-atlas + /seen)",
        ],
        worktree,
      );

      const push = spawnSync("git", ["push", "origin", "HEAD:gh-pages"], {
        cwd: worktree,
        stdio: "inherit",
        encoding: "utf8",
      });
      if (push.status === 0) {
        deployed = true;
        console.log(`Deployed to ${permanentUrl}`);
        console.log(`Short URL ${shortUrl} → brand-atlas`);
      } else {
        console.warn(
          `Push rejected (attempt ${attempt}); refetching gh-pages and retrying in ${delay}ms…`,
        );
        sleep(delay);
        delay = Math.min(delay * 2, 32000);
      }
    }
  } finally {
    spawnSync("git", ["worktree", "remove", "--force", worktree], {
      cwd: repoRoot,
      stdio: "inherit",
    });
  }
}

if (!deployed) throw new Error("Failed to push gh-pages after retries");
