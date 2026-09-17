import { describe, it, expect } from 'vitest'
import { buildPluginContents, normalizeIconLibraries } from '../src/internal'
import {
  ANIMATION_LINE,
  CSS_LINE,
  DIRECTIVES_LINE,
  QUASAR_VERSION,
  iconLibraryImport,
  iconSetImport,
  langImport,
  makeBaseOpts,
} from './helpers/template-fixtures'

const baseOpts = makeBaseOpts({ plugins: ['Notify', 'Dialog'] })

// Import-line fixtures shared by the describe blocks below; declared once so a
// template change has exactly one place to update in this file.
const MDI_ICON_SET_LINE = iconSetImport('mdi-v7')
const SVG_MDI_ICON_SET_LINE = iconSetImport('svg-mdi-v7')
const LANG_LINE = langImport('es')
const ICON_LIBRARY_LINE = iconLibraryImport('material-icons')
const MATERIAL_ICONS_LINE = iconLibraryImport('material-icons')
const MDI_LINE = iconLibraryImport('mdi-v7')

describe('buildPluginContents (F2: plugin template generator)', () => {
  it('imports installQ from quasar', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('import installQ from \'quasar/src/install-quasar.js\'')
  })

  it('imports requested plugins from quasar/src/plugins.js', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('import { Notify,Dialog } from \'quasar/src/plugins.js\'')
  })

  it('does not import the Lang plugin module (auto-installed by installQuasar)', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).not.toContain('quasar/src/plugins/lang/Lang.js')
  })

  it('does not carry a top-level lang entry on the vueApp.use payload', () => {
    const contents = buildPluginContents(baseOpts)
    const useStart = contents.indexOf('nuxtApp.vueApp.use({')
    // The use({...}) call closes at 8-space indentation; inner installQ calls
    // close deeper, so anchor on the dedented closer.
    const useEnd = contents.indexOf('\n    })', useStart)
    const payload = contents.slice(useStart, useEnd)
    expect(useEnd).toBeGreaterThan(useStart)
    expect(payload).not.toContain('lang')
  })

  it('does not import the IconSet plugin module (auto-installed by installQuasar)', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).not.toContain('quasar/src/plugins/icon-set/IconSet.js')
  })

  it('does not carry a top-level iconSet entry on the vueApp.use payload', () => {
    const contents = buildPluginContents(baseOpts)
    const useStart = contents.indexOf('nuxtApp.vueApp.use({')
    // The use({...}) call closes at 8-space indentation; inner installQ calls
    // close deeper, so anchor on the dedented closer.
    const useEnd = contents.indexOf('\n    })', useStart)
    const payload = contents.slice(useStart, useEnd)
    expect(useEnd).toBeGreaterThan(useStart)
    expect(payload).not.toContain('iconSet')
  })

  it('imports directives namespace', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('import * as directives from \'quasar/src/directives.js\'')
  })

  it('includes CSS import lines', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      css: ['quasar/src/css/index.sass', '~/assets/custom.sass'],
    })
    expect(contents).toContain('import \'quasar/src/css/index.sass\'')
    expect(contents).toContain('import \'~/assets/custom.sass\'')
  })

  it('includes animation import lines before CSS imports', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      animations: ['fadeIn'],
    })
    const animationIdx = contents.indexOf('import \'@quasar/extras/animate/fadeIn.css\'')
    const cssIdx = contents.indexOf('import \'quasar/src/css/index.sass\'')
    expect(animationIdx).toBeGreaterThan(-1)
    expect(animationIdx).toBeLessThan(cssIdx)
  })

  it('does not include animation imports when animations are empty or undefined', () => {
    expect(buildPluginContents(baseOpts)).not.toContain('@quasar/extras/animate/')
    expect(buildPluginContents({ ...baseOpts, animations: [] })).not.toContain('@quasar/extras/animate/')
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

  it('SSR branch: uses import.meta.server for server install with ssrContext', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('if(import.meta.server)')
    expect(contents).toContain('installQ(app, {...opts, ...includes}, nuxtApp.ssrContext.event.node)')
  })

  it('SSR branch: client fallback without ssrContext', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('} else {')
    expect(contents).toContain('installQ(app, {...opts, ...includes})')
  })

  it('includes onSSRHydrated block inside import.meta.client guard', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('if (import.meta.client)')
    expect(contents).toContain('onNuxtReady(() => {')
    expect(contents).toContain('$q?.onSSRHydrated?.()')
  })

  it('includes the quasar version in vueApp.use', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain(`version: ${QUASAR_VERSION}`)
  })

  it('serializes config as JSON', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('config: {')
    expect(contents).toContain('"dark": true')
  })

  it('includes plugin names in the includes.plugins object', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('plugins: { Notify,Dialog }')
  })

  it('includes directives in the includes object', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('directives,')
  })

  it('sets plugin name to nuxt:quasar-install', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('name: \'nuxt:quasar-install\'')
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
    expect(contents.match(/quasar\/icon-set\//g)).toHaveLength(1)
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
    const iconLibraryIdx = contents.indexOf(ICON_LIBRARY_LINE)
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
    const useIdx = contents.indexOf('nuxtApp.vueApp.use({')
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
    expect(contents.match(/quasar\/icon-set\//g)).toHaveLength(1)

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
    expect(contents.match(/quasar\/lang\//g)).toHaveLength(1)
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
    const iconLibraryIdx = contents.indexOf(ICON_LIBRARY_LINE)
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
    const useIdx = contents.indexOf('nuxtApp.vueApp.use({')
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
    expect(contents.match(/@quasar\/extras\/material-icons\/material-icons\.css/g)).toHaveLength(1)
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
