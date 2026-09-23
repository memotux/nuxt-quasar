import { describe, it, expect } from 'vitest'
import { buildPluginContents, normalizeIconLibraries } from '../src/internal'
import {
  ANIMATION_LINE,
  CSS_LINE,
  DIRECTIVES_LINE,
  iconLibraryImport,
  iconSetImport,
  importLines,
  langImport,
  makeBaseOpts,
  parseQuasarNamedImports,
  parseSideEffectImports,
} from './helpers/template-fixtures'

const baseOpts = makeBaseOpts({ plugins: ['Notify', 'Dialog'] })

// Import-line fixtures shared by the describe blocks below; declared once so a
// template change has exactly one place to update in this file.
const MDI_ICON_SET_LINE = iconSetImport('mdi-v7')
const SVG_MDI_ICON_SET_LINE = iconSetImport('svg-mdi-v7')
const LANG_LINE = langImport('es')
const MATERIAL_ICONS_LINE = iconLibraryImport('material-icons')
const MDI_LINE = iconLibraryImport('mdi-v7')

describe('buildPluginContents (F2: plugin template generator)', () => {
  it('emits the exact default plugin for the base options', () => {
    expect(buildPluginContents(baseOpts)).toMatchInlineSnapshot(`
      "import type { Plugin } from 'vue'
      import { defineNuxtPlugin, onNuxtReady } from '#app'
      import installQ from 'quasar/src/install-quasar.js'
      import { Notify,Dialog } from 'quasar/src/plugins.js'
      import * as directives from 'quasar/src/directives.js'

      import 'quasar/src/css/index.sass'

      export default defineNuxtPlugin({
        name: 'nuxt:quasar-install',
        setup(nuxtApp) {
          const includes = {
            directives,
            plugins: { Notify,Dialog },
            config: {
              "dark": true
            },
          }

          const quasarPlugin: Plugin & { version: string } = {
            version: '2.27.0',
            install(app, opts) {
              if(import.meta.server) {
                installQ(app, {...opts, ...includes}, nuxtApp.ssrContext!.event.node)
              } else {
                installQ(app, {...opts, ...includes})
              }
            },
          }

          nuxtApp.vueApp.use(quasarPlugin)

          if (import.meta.client) {
            onNuxtReady(() => {
              // Quasar SSR hydration takeover: with __QUASAR_SSR_CLIENT__ enabled,
              // Screen/Platform/Meta/Body defer client init to $q.onSSRHydrated(),
              // which the SSR application must call once hydration completes.
              const $q = nuxtApp.vueApp.config.globalProperties.$q as { onSSRHydrated?: () => void } | undefined
              $q?.onSSRHydrated?.()
            })
          }
        }
      })
      "
    `)
  })

  it('emits no animation imports when the selection is an empty array', () => {
    // module.ts passes normalizeAnimations() output to this generator, so the
    // template always receives an ARRAY in production: the empty array is the
    // real path, not the omitted-key one the snapshot above pins. The snapshot
    // therefore cannot stand in for this assertion.
    expect(buildPluginContents({ ...baseOpts, animations: [] }))
      .not.toContain('@quasar/extras/animate/')
  })

  it('includes CSS import lines', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      css: ['quasar/src/css/index.sass', '~/assets/custom.sass'],
    })
    expect(contents).toContain('import \'quasar/src/css/index.sass\'')
    expect(contents).toContain('import \'~/assets/custom.sass\'')
  })

  it('produces empty CSS section when css array is empty', () => {
    const contents = buildPluginContents({ ...baseOpts, css: [] })
    // Check the CSS section is between directives and defineNuxtPlugin
    const directivesIdx = contents.indexOf('import * as directives')
    const defineIdx = contents.indexOf('export default defineNuxtPlugin')
    const between = contents.slice(directivesIdx, defineIdx)
    // Between directives and defineNuxtPlugin, there should be no import lines
    expect(between).not.toContain('import \'')
  })

  it('serializes config as JSON', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('config: {\n        "dark": true\n      },')
  })

  it('re-indents nested config depth by depth around the base indent', () => {
    // The case above pins a FLAT config, where the CONFIG_FIELD_INDENT shift is
    // the whole story. Nesting is where that shift has to compose with the
    // relative indentation JSON.stringify already emitted, so the outer brace
    // keeps base+0, each level adds its own two spaces on top of base, and the
    // nested closing brace lands back at base+2.
    const contents = buildPluginContents({
      ...baseOpts,
      config: { dark: true, notify: { position: 'top' } },
    })

    expect(contents).toContain([
      '      config: {',
      '        "dark": true,',
      '        "notify": {',
      '          "position": "top"',
      '        }',
      '      },',
    ].join('\n'))
  })

  it('handles undefined config gracefully', () => {
    const contents = buildPluginContents({ ...baseOpts, config: undefined })
    expect(contents).toContain('config: undefined')
  })

  it('handles single plugin', () => {
    const contents = buildPluginContents({ ...baseOpts, plugins: ['Notify'] })
    expect(contents).toContain('import { Notify } from \'quasar/src/plugins.js\'')
    expect(contents).toContain('plugins: { Notify }')
  })
})

describe('buildPluginContents (iconSet option)', () => {
  it('emits exactly one icon-set import for a webfont name', () => {
    const contents = buildPluginContents({ ...baseOpts, iconSet: 'mdi-v7' })
    expect(contents).toContain(MDI_ICON_SET_LINE)
    expect(parseQuasarNamedImports(contents, 'iconSet', 'icon-set'))
      .toEqual([MDI_ICON_SET_LINE])
  })

  it('places the icon-set import between the static Quasar imports and the @quasar/extras imports', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      iconSet: 'mdi-v7',
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
    })

    const directivesIdx = contents.indexOf(DIRECTIVES_LINE)
    const iconSetIdx = contents.indexOf(MDI_ICON_SET_LINE)
    const animationIdx = contents.indexOf(ANIMATION_LINE)
    const iconLibraryIdx = contents.indexOf(MATERIAL_ICONS_LINE)
    const cssIdx = contents.indexOf(CSS_LINE)

    expect(iconSetIdx).toBeGreaterThan(directivesIdx)
    expect(animationIdx).toBeGreaterThan(iconSetIdx)
    expect(iconLibraryIdx).toBeGreaterThan(animationIdx)
    expect(cssIdx).toBeGreaterThan(iconLibraryIdx)
  })

  it('spreads iconSet into the install payload alongside directives, plugins and config', () => {
    const contents = buildPluginContents({ ...baseOpts, iconSet: 'mdi-v7' })

    expect(contents).toContain('directives,')
    expect(contents).toContain('plugins: { Notify,Dialog }')
    expect(contents).toContain('iconSet,')

    // iconSet lives inside the `includes` object spread into installQuasar,
    // after config and before the vueApp.use call.
    const includesIdx = contents.indexOf('const includes = {')
    const configIdx = contents.indexOf('config:')
    const iconSetIdx = contents.indexOf('iconSet,')
    const useIdx = contents.indexOf('nuxtApp.vueApp.use(')
    expect(includesIdx).toBeGreaterThan(-1)
    expect(iconSetIdx).toBeGreaterThan(configIdx)
    expect(iconSetIdx).toBeGreaterThan(includesIdx)
    expect(iconSetIdx).toBeLessThan(useIdx)
    expect(contents).toContain('installQ(app, {...opts, ...includes})')
  })

  it('emits the svg icon-set import with the same deterministic position', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      iconSet: 'svg-mdi-v7',
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
    })

    expect(contents).toContain(SVG_MDI_ICON_SET_LINE)
    expect(parseQuasarNamedImports(contents, 'iconSet', 'icon-set'))
      .toEqual([SVG_MDI_ICON_SET_LINE])

    const iconSetIdx = contents.indexOf(SVG_MDI_ICON_SET_LINE)
    expect(iconSetIdx).toBeGreaterThan(contents.indexOf(DIRECTIVES_LINE))
    expect(iconSetIdx).toBeLessThan(contents.indexOf(ANIMATION_LINE))
    expect(contents).toContain('iconSet,')
  })

  it('emits no icon-set import and no payload iconSet when the option is omitted or empty', () => {
    const cases = [
      baseOpts,
      { ...baseOpts, iconSet: '' },
    ]
    for (const opts of cases) {
      const contents = buildPluginContents(opts)
      expect(contents).not.toContain('quasar/icon-set/')
      expect(contents).not.toContain('iconSet')
    }
  })
})

describe('buildPluginContents (lang option)', () => {
  it('emits exactly one lang import for a valid name', () => {
    const contents = buildPluginContents({ ...baseOpts, lang: 'es' })
    expect(contents).toContain(LANG_LINE)
    expect(parseQuasarNamedImports(contents, 'lang', 'lang'))
      .toEqual([LANG_LINE])
  })

  it('places the lang import between the static Quasar imports and the @quasar/extras imports', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      lang: 'es',
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
    })

    const directivesIdx = contents.indexOf(DIRECTIVES_LINE)
    const langIdx = contents.indexOf(LANG_LINE)
    const animationIdx = contents.indexOf(ANIMATION_LINE)
    const iconLibraryIdx = contents.indexOf(MATERIAL_ICONS_LINE)
    const cssIdx = contents.indexOf(CSS_LINE)

    expect(langIdx).toBeGreaterThan(directivesIdx)
    expect(animationIdx).toBeGreaterThan(langIdx)
    expect(iconLibraryIdx).toBeGreaterThan(animationIdx)
    expect(cssIdx).toBeGreaterThan(iconLibraryIdx)
  })

  it('places the lang import after the iconSet import when both are set', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      iconSet: 'mdi-v7',
      lang: 'es',
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
    })

    const iconSetIdx = contents.indexOf(MDI_ICON_SET_LINE)
    const langIdx = contents.indexOf(LANG_LINE)
    const animationIdx = contents.indexOf(ANIMATION_LINE)

    expect(iconSetIdx).toBeGreaterThan(-1)
    expect(langIdx).toBeGreaterThan(iconSetIdx)
    expect(animationIdx).toBeGreaterThan(langIdx)
  })

  it('spreads lang into the install payload alongside directives, plugins, config and iconSet', () => {
    const contents = buildPluginContents({ ...baseOpts, iconSet: 'mdi-v7', lang: 'es' })

    expect(contents).toContain('directives,')
    expect(contents).toContain('plugins: { Notify,Dialog }')
    expect(contents).toContain('config:')
    expect(contents).toContain('iconSet,')
    expect(contents).toContain('lang,')

    // lang lives inside the `includes` object spread into installQuasar,
    // after config and before the vueApp.use call.
    const includesIdx = contents.indexOf('const includes = {')
    const configIdx = contents.indexOf('config:')
    const langIdx = contents.indexOf('lang,')
    const useIdx = contents.indexOf('nuxtApp.vueApp.use(')
    expect(includesIdx).toBeGreaterThan(-1)
    expect(langIdx).toBeGreaterThan(configIdx)
    expect(langIdx).toBeGreaterThan(includesIdx)
    expect(langIdx).toBeLessThan(useIdx)
    expect(contents).toContain('installQ(app, {...opts, ...includes})')
  })

  it('emits no lang import and no payload lang when the option is omitted or empty', () => {
    const cases = [
      baseOpts,
      { ...baseOpts, lang: '' },
    ]
    for (const opts of cases) {
      const contents = buildPluginContents(opts)
      expect(contents).not.toContain('quasar/lang/')
      expect(contents).not.toContain('lang,')
    }
  })
})

describe('buildPluginContents (iconLibraries option)', () => {
  it('emits one import line per selected icon library', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      iconLibraries: ['material-icons', 'mdi-v7'],
    })
    expect(contents).toContain(MATERIAL_ICONS_LINE)
    expect(contents).toContain(MDI_LINE)
  })

  it('emits a single line per name once the selection is normalized', () => {
    // Dedupe is the normalizer's job; the template renders what it is given.
    const contents = buildPluginContents({
      ...baseOpts,
      iconLibraries: normalizeIconLibraries(['material-icons', '', 'material-icons']),
    })
    expect(parseSideEffectImports(contents, '@quasar/extras/material-icons/'))
      .toEqual([MATERIAL_ICONS_LINE])
  })

  it('emits the lines in the order given', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      iconLibraries: ['mdi-v7', 'material-icons'],
    })
    expect(contents.indexOf(MDI_LINE)).toBeLessThan(contents.indexOf(MATERIAL_ICONS_LINE))
  })

  it('places icon library imports after animations and before css', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
    })
    const animationIdx = contents.indexOf(ANIMATION_LINE)
    const iconIdx = contents.indexOf(MATERIAL_ICONS_LINE)
    const cssIdx = contents.indexOf(CSS_LINE)

    expect(animationIdx).toBeGreaterThan(-1)
    expect(animationIdx).toBeLessThan(iconIdx)
    expect(iconIdx).toBeLessThan(cssIdx)
  })

  it('emits icon library imports with no animations selected', () => {
    const contents = buildPluginContents({ ...baseOpts, iconLibraries: ['material-icons'] })
    expect(contents.indexOf(MATERIAL_ICONS_LINE)).toBeLessThan(contents.indexOf(CSS_LINE))
    expect(contents).not.toContain('@quasar/extras/animate/')
  })

  it('groups icon imports cleanly when animations and css are both absent', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      css: [],
      iconLibraries: ['themify'],
    })
    expect(contents).toContain(
      'import \'@quasar/extras/themify/themify.css\'\n\nexport default defineNuxtPlugin',
    )
  })

  it('emits no icon import when iconLibraries is empty or undefined', () => {
    expect(buildPluginContents({ ...baseOpts, iconLibraries: [] }))
      .not.toContain('@quasar/extras/material-icons/')
    expect(buildPluginContents(baseOpts))
      .not.toContain('@quasar/extras/material-icons/')
  })
})

describe('buildPluginContents (import line shape)', () => {
  // `importLines()` (helpers/template-fixtures.ts) collects only lines that
  // start at column 0 with `import `, so an indented import would be invisible
  // to every ordering assertion built on it — silently weakening them without
  // failing. The template emits no indented import today; these cases pin that
  // shape so a future one fails here instead of disappearing there.
  it('emits no indented import for the default base options', () => {
    const lines = buildPluginContents(baseOpts).split('\n')

    expect(lines.filter(line => /^\s+import\s/.test(line))).toEqual([])
    expect(lines.some(line => line.startsWith('import '))).toBe(true)
  })

  it('emits no indented import when every import group is active', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
      iconSet: 'mdi-v7',
      lang: 'es',
    })
    const lines = contents.split('\n')

    expect(lines.filter(line => /^\s+import\s/.test(line))).toEqual([])
    expect(lines.some(line => line.startsWith('import '))).toBe(true)
  })
})

describe('buildPluginContents (import order)', () => {
  const ICON_SET_VARIANTS = ['mdi-v7', 'svg-mdi-v7', 'fontawesome-v7'] as const

  it.each(ICON_SET_VARIANTS)(
    'emits every import group in the documented total order (iconSet: %s)',
    (iconSet) => {
      const contents = buildPluginContents({
        ...baseOpts,
        iconSet,
        lang: 'es',
        animations: ['fadeIn'],
        iconLibraries: ['material-icons'],
      })

      // The two static Quasar imports are asserted by their own tests above, so
      // they are written out here; every other line comes from the helper so the
      // expected order cannot drift from the shared constants.
      expect(importLines(contents)).toEqual([
        'import type { Plugin } from \'vue\'',
        'import { defineNuxtPlugin, onNuxtReady } from \'#app\'',
        'import installQ from \'quasar/src/install-quasar.js\'',
        'import { Notify,Dialog } from \'quasar/src/plugins.js\'',
        DIRECTIVES_LINE,
        iconSetImport(iconSet),
        langImport('es'),
        ANIMATION_LINE,
        iconLibraryImport('material-icons'),
        CSS_LINE,
      ])
    },
  )

  it.each(ICON_SET_VARIANTS)(
    'emits the same total order when no animations are selected (iconSet: %s)',
    (iconSet) => {
      const contents = buildPluginContents({
        ...baseOpts,
        iconSet,
        lang: 'es',
        iconLibraries: ['material-icons'],
      })

      expect(importLines(contents)).toEqual([
        'import type { Plugin } from \'vue\'',
        'import { defineNuxtPlugin, onNuxtReady } from \'#app\'',
        'import installQ from \'quasar/src/install-quasar.js\'',
        'import { Notify,Dialog } from \'quasar/src/plugins.js\'',
        DIRECTIVES_LINE,
        iconSetImport(iconSet),
        langImport('es'),
        iconLibraryImport('material-icons'),
        CSS_LINE,
      ])
    },
  )
})
