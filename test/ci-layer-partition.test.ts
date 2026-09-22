/**
 * Guards the CI test-layer partition.
 *
 * WHY THIS EXISTS: CI splits the suite across two scripts. `test:no-browser`
 * runs everything except the browser specs (via `--exclude '<glob>'`) and
 * `test:browser` runs only the browser specs (via a positional filter). The
 * excluded set must be a SUBSET of the included set: every path the exclusion
 * glob matches must also match the inclusion filter, else it runs in NEITHER
 * job. That regression is real: the inclusion filter was once anchored on
 * `test/` while the glob matched at any depth, so `playground/e2e/browser-*`
 * fell through both layers. The scripts are PARSED from package.json, never
 * restated, so editing one without the other turns this guard RED.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url))
const repoRoot = dirname(packageJsonPath)

/** The one spec today that the browser layer is expected to own. */
const BROWSER_SPEC = 'test/e2e/browser-hydration.test.ts'
/** Directories whose contents are never CI test files. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.nuxt', '.output'])

/**
 * A glob match implies its literal fragment occurs in the matched path: each
 * metacharacter only matches characters around the literal segments, so the
 * longest remaining segment (here `e2e/browser-`) is in every matched path.
 */
function literalFragmentOf(glob: string): string {
  const longest = glob
    .split(/[*?[\]]/)
    .filter(Boolean)
    .reduce((longestSoFar, segment) => segment.length > longestSoFar.length ? segment : longestSoFar, '')
  return longest.replace(/^\/+|\/+$/g, '')
}

/** Extracts the glob inside `--exclude '<glob>'`; fails loudly with the raw script. */
function exclusionGlobOf(script: string | undefined): string {
  const glob = script?.match(/--exclude\s+'([^']+)'/)?.[1]
  if (!glob) throw new Error(`cannot extract the --exclude glob from test:no-browser: ${JSON.stringify(script)}`)
  return glob
}

/** Extracts the positional filter token after `vitest run`; fails loudly with the raw script. */
function inclusionFilterOf(script: string | undefined): string {
  const tokens = script?.split(/\s+/) ?? []
  const filter = tokens.slice(tokens.indexOf('run') + 1).find(token => !token.startsWith('-'))
  if (!filter) throw new Error(`cannot extract the positional filter from test:browser: ${JSON.stringify(script)}`)
  return filter
}

/** Recursively collects repo test files as POSIX paths relative to the repo root. */
async function collectTestFiles(dir: string, files: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.build')) continue
      await collectTestFiles(join(dir, entry.name), files)
    }
    else if (/\.(?:test|spec)\.ts$/.test(entry.name)) {
      files.push(relative(repoRoot, join(dir, entry.name)).split(sep).join('/'))
    }
  }
  return files
}

describe('ci layer partition', () => {
  it('keeps the exclusion a subset of the inclusion so no test runs in zero layers', async () => {
    const { scripts } = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> }
    const glob = exclusionGlobOf(scripts?.['test:no-browser'])
    const inclusion = inclusionFilterOf(scripts?.['test:browser'])
    const fragment = literalFragmentOf(glob)

    // A - universal invariant: the inclusion filter must be a substring of the
    // exclusion's literal fragment, so ANY path the glob can match is also
    // matched, making the subset property hold for every possible path.
    expect(fragment, `"${inclusion}" is not part of "${fragment}": a file the fast layer excludes at "${glob}" can be missed by the browser layer and run in NO CI job`).toContain(inclusion)

    // B - concrete pin: the known browser spec lands in the browser layer and,
    // by virtue of the fragment, is excluded from the fast layer.
    //
    // A and B are complementary, not redundant, so do not collapse them: A is
    // the universal property that must hold for EVERY conceivable path, while B
    // states the relation for the one spec we actually ship today. A alone
    // would stay silent if the constant drifted to a name no longer used, and B
    // alone would not generalise to a newly added browser spec. Existence on disk
    // is a third, separate property, asserted in the sibling test below, because
    // neither A nor B can see the filesystem.
    expect(BROWSER_SPEC).toContain(inclusion)
    expect(BROWSER_SPEC).toContain(fragment)

    // C - the invariant over the real tree: every excluded test file must still
    // land in the browser layer, or it runs nowhere.
    const offenders = (await collectTestFiles(repoRoot))
      .filter(path => path.includes(fragment) && !path.includes(inclusion))
    expect(offenders, `test files that run in no CI layer (excluded from the fast layer, missed by the browser layer): ${offenders.join(', ')}`).toEqual([])
  })

  it('pins a browser layer that really exists, so zero browser tests cannot pass green', async () => {
    // WHY THIS TEST EXISTS. The assertions above never touch the filesystem: A
    // and B compare two constants, and C's offender list is empty by
    // construction when nothing matches the fragment. So renaming the browser
    // spec would have left every one of them GREEN while `test:browser`
    // selected no file at all and the CI browser job verified nothing. That is
    // the same "green signal that proves nothing" defect class this repository
    // removed when it deleted the drift guards' `skipIf` gates, so membership is
    // asserted against the real tree here.
    const { scripts } = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> }
    const fragment = literalFragmentOf(exclusionGlobOf(scripts?.['test:no-browser']))
    const inclusion = inclusionFilterOf(scripts?.['test:browser'])
    const files = await collectTestFiles(repoRoot)

    // The pinned spec must exist, not merely be named.
    await expect(stat(join(repoRoot, BROWSER_SPEC)), `pinned browser spec is missing from disk: ${BROWSER_SPEC}`).resolves.toBeDefined()
    expect(files, `pinned browser spec is not collected from the test tree: ${BROWSER_SPEC}`).toContain(BROWSER_SPEC)

    // Both layers must be non-degenerate: the inclusion filter selects at least
    // one real file, and the exclusion glob matches at least one real file. An
    // empty side would satisfy every subset relation above while testing nothing.
    expect(
      files.filter(path => path.includes(inclusion)),
      `test:browser selects no file at all (filter "${inclusion}"), so the browser layer verifies nothing`,
    ).not.toEqual([])
    expect(
      files.filter(path => path.includes(fragment)),
      `the fast layer excludes no file (fragment "${fragment}"), so --exclude is dead weight`,
    ).not.toEqual([])
  })
})
