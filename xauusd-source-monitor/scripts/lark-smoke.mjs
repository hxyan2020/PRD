/**
 * Local smoke for Lark agent brain (no Lark credentials required).
 * Run from xauusd-source-monitor: node --experimental-strip-types is unavailable;
 * we inline a minimal harness by spawning via dynamic import of compiled paths.
 *
 * Prefer: npx --yes tsx scripts/lark-smoke-runner.ts
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const runner = join(here, 'lark-smoke-runner.ts')
const r = spawnSync('npx', ['--yes', 'tsx', runner], {
  cwd: join(here, '..'),
  encoding: 'utf8',
  stdio: 'inherit',
  env: { ...process.env, OPENAI_API_KEY: '' }, // force rules path for deterministic smoke
})
process.exit(r.status ?? 1)
