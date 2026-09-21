import { describe, expect, it } from 'vitest'
import { $fetch, useTestContext } from '@nuxt/test-utils/e2e'
import { fixtureBuildDir, fixtureDir, readGeneratedPlugin, setupScoped } from './helpers'

// `useTestContext().options` holds the test-utils setup options (where
// `build` is a boolean), so the module's `transpile.unshift('quasar')` is
// only visible on the resolved Nuxt config at `ctx.nuxt.options`.
function resolvedTranspile(): string[] {
  return (useTestContext().nuxt?.options.build.transpile ?? []) as string[]
}

describe('wiring · basic fixture (defaults)', () => {
  setupScoped({ rootDir: fixtureDir('basic'), buildDir: fixtureBuildDir('basic') })

  it('renders a real QBtn via component auto-import in the SSR output', async () => {
    const html = await $fetch('/')
    // QBtn must server-render as a <button> carrying the q-btn class —
    // this proves the components:dirs wiring (auto-import) end to end.
    expect(html).toMatch(/<button[^>]*class="[^"]*\bq-btn\b/)
    expect(html).toContain('fixture-qbtn')
  })

  it('exposes $q with the module-pinned Quasar version at SSR', async () => {
    const html = await $fetch('/')
    const quasar = await import('quasar/package.json', { with: { type: 'json' } })
    // useQuasar() only works if the generated plugin actually installed
    // Quasar on the app; $q.version is pinned by the module from
    // quasar/package.json, so the rendered text must match it exactly.
    expect(html).toContain(`<p id="q-version">${quasar.default.version}</p>`)
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

  // The two tests below assert the JS-lookup options TOOK EFFECT, not merely
  // that the generator emitted an import. The `emits iconSet, lang, ...` test
  // reads the generated plugin text; these read the installed `$q` after SSR
  // install, which is the only place the option -> payload -> Quasar install
  // chain is exercised end to end. Quasar reads exactly the `lang` / `iconSet`
  // keys from the `includes` payload (quasar/src/install-quasar.js).
  it('applies iconSet: the SSR payload installs the configured mdi-v7 mapping', async () => {
    const html = await $fetch('/')

    expect(html).toContain('<p id="q-icon-set">mdi-v7</p>')
  })

  it('applies lang: the SSR payload installs the configured es language pack', async () => {
    const html = await $fetch('/')

    expect(html).toContain('<p id="q-lang">es</p>')
  })

  it('renders a real QBtn via component auto-import in the SSR output', async () => {
    const html = await $fetch('/')
    // QBtn must server-render as a <button> carrying the q-btn class —
    // this proves the components:dirs wiring (auto-import) end to end.
    expect(html).toMatch(/<button[^>]*class="[^"]*\bq-btn\b/)
    expect(html).toContain('fixture-qbtn')
  })

  it('exposes $q with the module-pinned Quasar version at SSR', async () => {
    const html = await $fetch('/')
    const quasar = await import('quasar/package.json', { with: { type: 'json' } })
    // useQuasar() only works if the generated plugin actually installed
    // Quasar on the app; $q.version is pinned by the module from
    // quasar/package.json, so the rendered text must match it exactly.
    expect(html).toContain(`<p id="q-version">${quasar.default.version}</p>`)
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
    // Regression (defu merge): the fixture re-declares the module default
    // 'Notify' explicitly. defu concat-merges without dedup, which used to
    // emit a duplicate specifier (Notify,Notify,...) and a hard PARSE_ERROR.
    // The deduped specifier must preserve first-occurrence order with no
    // duplicate entries.
    expect(plugin).toMatch(/import \{ Notify,Dialog,LocalStorage \} from 'quasar\/src\/plugins\.js'/)
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
