import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve as resolvePath } from 'node:path'
import { createTest, setTestContext } from '@nuxt/test-utils/e2e'
import type { TestOptions } from '@nuxt/test-utils/e2e'

export function fixtureDir(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

// `setup()` binds the fixture context globally, so only the last `setup()`
// call in a file survives: the other suites' `beforeAll` hooks would run
// against a stale (or already torn down) context. `createTest()` returns the
// same hooks `setup()` registers, and pinning the context to this describe
// block keeps each fixture's server, build dir and Nuxt config isolated.
export function setupScoped(options: Partial<TestOptions>) {
  const hooks = createTest(options)
  const ctx = hooks.ctx
  beforeAll(async () => {
    setTestContext(ctx)
    await hooks.beforeAll()
  }, ctx.options.setupTimeout)
  beforeEach(hooks.beforeEach)
  afterEach(hooks.afterEach)
  afterAll(async () => {
    setTestContext(ctx)
    await hooks.afterAll()
  }, ctx.options.teardownTimeout)
}

// Each fixture gets an explicit buildDir so the generated plugin lands at a
// stable path (`<fixture>/.nuxt/quasar/plugin.ts`) instead of the random
// `.nuxt/test/<id>` directory @nuxt/test-utils picks for production builds.
export function fixtureBuildDir(name: string): string {
  return resolvePath(fixtureDir(name), '.nuxt')
}

// The browser suite must NOT reuse `fixtureBuildDir`: vitest runs test files
// in parallel, and @nuxt/test-utils tears its buildDir down with a recursive
// `rm`. Two suites building the same `.nuxt` race on the same output tree
// (`ENOTEMPTY: rmdir .nuxt/output`, 500s from the dev server, then `ENOENT`
// on the generated `quasar/plugin.ts`). A sibling `.build-browser` directory
// is isolated from the wiring suite and already covered by the `.build-*`
// rule in .gitignore.
export function browserBuildDir(name: string): string {
  return resolvePath(fixtureDir(name), '.build-browser')
}

export async function readGeneratedPlugin(name: string): Promise<string> {
  return readFile(`${fixtureBuildDir(name)}/quasar/plugin.ts`, 'utf8')
}
