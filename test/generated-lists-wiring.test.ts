import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const GENERATE_COMMAND = 'node scripts/generate-quasar-lists.mjs'

async function packageScripts(): Promise<Record<string, string>> {
  const pkg = JSON.parse(await readFile(join(REPO_ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
  return pkg.scripts ?? {}
}

/**
 * Wiring guard for the generated snapshot workflow.
 *
 * The snapshot (`src/internal/generated-quasar-lists.ts`) describes the
 * packages installed in this repository, so it must be regenerated before
 * package preparation and package tests (write mode), while CI must only
 * detect a stale snapshot (check mode, never writing). These assertions pin
 * that contract against the real `package.json` and `ci.yml` instead of
 * restating the scripts, so editing one without the other turns this RED.
 */
describe('generated lists script wiring', () => {
  it.each(['prepack', 'test', 'test:no-browser', 'test:browser'])(
    '%s regenerates the snapshot before use (write mode, never --check)',
    async (script) => {
      const scripts = await packageScripts()
      expect(scripts[script]).toContain(GENERATE_COMMAND)
      expect(scripts[script]).not.toContain('--check')
    },
  )

  it('CI checks snapshot freshness without rewriting it', async () => {
    const ci = await readFile(join(REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf8')
    const wired = ci.split('\n').filter(line => line.includes('generate-quasar-lists'))
    expect(wired.length).toBeGreaterThan(0)
    // Every CI reference must carry --check: CI detects stale snapshots
    // rather than silently rewriting them.
    for (const line of wired) {
      expect(line).toContain('--check')
    }
  })
})
