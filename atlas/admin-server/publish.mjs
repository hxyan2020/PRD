import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { atlasRoot, PATHS, loadCollection } from "./store.mjs";

function run(cmd, args, cwd, env = process.env) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    env,
  });
  return {
    ok: res.status === 0,
    status: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
}

/**
 * Rebuild content-i18n.json from source packs, then optionally commit + deploy Pages.
 * @param {{ deploy?: boolean, commitMessage?: string }} opts
 */
export function publishCatalog(opts = {}) {
  const deploy = opts.deploy !== false;
  const logs = [];

  // Ensure collection meta timestamps are fresh
  const collection = loadCollection();
  collection.meta = {
    ...collection.meta,
    generatedAt: new Date().toISOString(),
    totalGames: collection.games.length,
    totalVariations: collection.games.reduce(
      (a, g) => a + (g.variations?.length || 0),
      0,
    ),
  };
  writeFileSync(PATHS.collection, JSON.stringify(collection));
  logs.push("Updated collection.json meta timestamps");

  const i18nScript = join(atlasRoot, "scripts", "generate-content-i18n.mjs");
  if (existsSync(i18nScript)) {
    const gen = run("node", [i18nScript], atlasRoot);
    logs.push(
      gen.ok
        ? "Regenerated content-i18n.json for all locales"
        : `content-i18n generation failed: ${gen.stderr || gen.stdout}`,
    );
    if (!gen.ok) {
      return { ok: false, logs, error: "Failed to regenerate content-i18n.json" };
    }
  } else {
    logs.push("Skipped content-i18n (script missing)");
  }

  if (!deploy) {
    return { ok: true, logs, deployed: false };
  }

  const repoRoot = join(atlasRoot, "..");
  // Stage Ludus Atlas data + i18n source packs
  const add = run(
    "git",
    [
      "add",
      "atlas/public/data/collection.json",
      "atlas/public/data/tutorials.json",
      "atlas/public/data/content-i18n.json",
      "atlas/public/uploads",
      "atlas/scripts/content-i18n-data/curated-en.json",
      "atlas/scripts/content-i18n-data/curated-i18n.json",
      "atlas/scripts/content-i18n-data/archetypes-en.json",
      "atlas/scripts/content-i18n-data/archetypes-i18n.json",
    ],
    repoRoot,
  );
  logs.push(add.ok ? "Staged catalog data for commit" : `git add failed: ${add.stderr}`);

  const status = run("git", ["status", "--porcelain"], repoRoot);
  const dirty = (status.stdout || "").trim().length > 0;
  if (dirty) {
    const msg =
      opts.commitMessage ||
      `Publish Ludus Atlas catalog edits (${new Date().toISOString()})`;
    const commit = run("git", ["commit", "-m", msg], repoRoot);
    logs.push(
      commit.ok
        ? "Committed catalog edits"
        : `git commit: ${commit.stderr || commit.stdout || "nothing to commit"}`,
    );
    const branch = run("git", ["branch", "--show-current"], repoRoot);
    const b = (branch.stdout || "").trim();
    if (b) {
      const push = run("git", ["push", "-u", "origin", b], repoRoot);
      logs.push(
        push.ok ? `Pushed ${b}` : `git push failed: ${push.stderr || push.stdout}`,
      );
    }
  } else {
    logs.push("No git changes to commit");
  }

  const deployScript = join(atlasRoot, "scripts", "deploy-gh-pages.mjs");
  if (existsSync(deployScript)) {
    // Keep admin-edited collection.json — do not regenerate from scripts.
    const dep = run("node", [deployScript], atlasRoot, {
      ...process.env,
      SKIP_DATA_REGEN: "1",
      GITHUB_PAGES: "1",
    });
    logs.push(
      dep.ok
        ? "Deployed to GitHub Pages (/ludus-atlas/)"
        : `Deploy failed: ${dep.stderr || dep.stdout}`,
    );
    if (!dep.ok) {
      return {
        ok: false,
        logs,
        error: "Deploy to GitHub Pages failed",
        deployed: false,
      };
    }
    return {
      ok: true,
      logs,
      deployed: true,
      url: "https://hxyan2020.github.io/PRD/ludus-atlas/",
    };
  }

  logs.push("Deploy script missing — data saved locally only");
  return { ok: true, logs, deployed: false };
}
