import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve as resolvePath } from 'node:path'
import { $fetch, createTest, setTestContext, useTestContext } from '@nuxt/test-utils/e2e'
import type { TestOptions } from '@nuxt/test-utils/e2e'

function fixtureDir(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

// `setup()` binds the fixture context globally, so only the last `setup()`
// call in a file survives: the other suites' `beforeAll` hooks would run
// against a stale (or already torn down) context. `createTest()` returns the
// same hooks `setup()` registers, and pinning the context to this describe
// block keeps each fixture's server, build dir and Nuxt config isolated.
function setupScoped(options: Partial<TestOptions>) {
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
function fixtureBuildDir(name: string): string {
  return resolvePath(fixtureDir(name), '.nuxt')
}

async function readGeneratedPlugin(name: string): Promise<string> {
  return readFile(`${fixtureBuildDir(name)}/quasar/plugin.ts`, 'utf8')
}

// `useTestContext().options` holds the test-utils setup options (where
// `build` is a boolean), so the module's `transpile.unshift('quasar')` is
// only visible on the resolved Nuxt config at `ctx.nuxt.options`.
function resolvedTranspile(): string[] {
  return (useTestContext().nuxt?.options.build.transpile ?? []) as string[]
}

describe('wiring · basic fixture (defaults)', () => {
  setupScoped({ rootDir: fixtureDir('basic'), buildDir: fixtureBuildDir('basic') })

  it('serves an HTML page with the fixture marker', async () => {
    const html = await $fetch('/')
    expect(html).toContain('basic')
  })

  it('generates the plugin with the default config block', async () => {
    const plugin = await readGeneratedPlugin('basic')
    const quasar = await import('quasar/package.json', { with: { type: 'json' } })

    // Pinned by a3c37f2: config body at column 8, closing brace at column 6.
    expect(plugin).toMatch(/config: \{\n {8}"dark": true\n {6}\},/)
    // Version line is exact, not a substring.
    expect(plugin).toContain(`version: '${quasar.default.version}'`)
    // Notify plugin is wired in.
    expect(plugin).toContain('Notify')
  })

  it('prepends "quasar" to build.transpile (wiring row from Finding A)', () => {
    const transpile = resolvedTranspile()
    expect(transpile).toContain('quasar')
    // Idempotent: only one occurrence even if the module is reinstalled.
    expect(transpile.filter(t => t === 'quasar')).toHaveLength(1)
  })
})

describe('wiring · all-options fixture (every option active)', () => {
  setupScoped({ rootDir: fixtureDir('all-options'), buildDir: fixtureBuildDir('all-options') })

  it('serves an HTML page with the fixture marker', async () => {
    const html = await $fetch('/')
    expect(html).toContain('all-options')
  })

  it('emits iconSet, lang, animations, and iconLibraries imports', async () => {
    const plugin = await readGeneratedPlugin('all-options')

    // iconSet import (dynamic-import-free because mdi-v7 is a webfont).
    expect(plugin).toContain(`import iconSet from 'quasar/icon-set/mdi-v7.js'`)
    // lang import.
    expect(plugin).toContain(`import lang from 'quasar/lang/es.js'`)
    // animations (both).
    expect(plugin).toContain(`import '@quasar/extras/animate/fadeIn.css'`)
    expect(plugin).toContain(`import '@quasar/extras/animate/bounceInLeft.css'`)
    // icon libraries (both).
    expect(plugin).toContain(`import '@quasar/extras/mdi-v7/mdi-v7.css'`)
    expect(plugin).toContain(`import '@quasar/extras/material-icons/material-icons.css'`)
    // All configured plugins land in the single static plugin specifier. The
    // module default `plugins: ['Notify']` is merged with the fixture list
    // rather than replaced, so the fixture must not redeclare 'Notify'
    // (a duplicate specifier breaks the bundle) and the emitted order is the
    // merged, sorted set.
    expect(plugin).toMatch(/import \{ Dialog,LocalStorage,Notify \} from 'quasar\/src\/plugins\.js'/)
    // iconSet and lang keys on the install payload.
    expect(plugin).toContain('iconSet,')
    expect(plugin).toContain('lang,')
  })

  it('preserves the canonical import order: iconSet → lang → animations → iconLibraries → css', async () => {
    const plugin = await readGeneratedPlugin('all-options')

    const idxIconSet = plugin.indexOf(`import iconSet from 'quasar/icon-set/mdi-v7.js'`)
    const idxLang = plugin.indexOf(`import lang from 'quasar/lang/es.js'`)
    const idxAnimations = plugin.indexOf(`import '@quasar/extras/animate/fadeIn.css'`)
    const idxIconLibraries = plugin.indexOf(`import '@quasar/extras/mdi-v7/mdi-v7.css'`)
    const idxCss = plugin.indexOf(`import 'quasar/src/css/index.sass'`)

    expect(idxIconSet).toBeGreaterThan(-1)
    expect(idxLang).toBeGreaterThan(idxIconSet)
    expect(idxAnimations).toBeGreaterThan(idxLang)
    expect(idxIconLibraries).toBeGreaterThan(idxAnimations)
    expect(idxCss).toBeGreaterThan(idxIconLibraries)
  })

  it('serializes the config object with the pinned column alignment (body col 8, closing brace col 6)', async () => {
    const plugin = await readGeneratedPlugin('all-options')
    // Body at column 8, closing brace at column 6 — frozen by a3c37f2.
    // JSON.stringify(indent 2) shifted by the 6-space `config:` field indent
    // puts depth-1 keys at column 8, depth-2 keys at column 10, and the
    // nested closing brace back at column 8.
    expect(plugin).toMatch(/config: \{\n {8}"dark": true,\n {8}"brand": \{\n {10}"primary": "#ff0000"\n {8}\}\n {6}\},/)
  })

  it('prepends "quasar" to build.transpile (wiring row from Finding A)', () => {
    expect(resolvedTranspile()).toContain('quasar')
  })
})

describe('wiring · ssr-off fixture (ssr: false)', () => {
  setupScoped({ rootDir: fixtureDir('ssr-off'), buildDir: fixtureBuildDir('ssr-off') })

  it('serves the client-only shell (no server-rendered app markup)', async () => {
    const html = await $fetch('/')
    // With `ssr: false` the fixture marker is only produced after client
    // hydration, so the strict assertion here is the empty SPA shell plus
    // Nuxt's own `data-ssr="false"` signal.
    expect(html).toMatch(/<div id="__nuxt"><\/div>/)
    expect(html).toContain('data-ssr="false"')
  })

  it('generates the plugin with both install branches intact (server branch wrapped in ssrContext)', async () => {
    const plugin = await readGeneratedPlugin('ssr-off')
    // The plugin template emits both branches regardless of `ssr: false` —
    // runtime environment decides at install time. Pin the shape.
    expect(plugin).toContain('if(import.meta.server)')
    expect(plugin).toContain('nuxtApp.ssrContext.event.node')
    expect(plugin).toContain('if (import.meta.client)')
  })

  it('prepends "quasar" to build.transpile exactly once (wiring row from Finding A)', () => {
    expect(resolvedTranspile().filter(t => t === 'quasar')).toHaveLength(1)
  })
})
