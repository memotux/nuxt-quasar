import { describe, it, expect } from 'vitest'
import { buildPluginContents, normalizeIconLibraries } from '../src/internal'

const QUASAR_VERSION = `'2.27.0'`

const baseOpts = {
  plugins: ['Notify', 'Dialog'],
  css: ['quasar/src/css/index.sass'],
  config: { dark: true },
  quasarVersion: QUASAR_VERSION,
}

describe('buildPluginContents (F2: plugin template generator)', () => {
  it('imports installQ from quasar', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('import installQ from \'quasar/src/install-quasar.js\'')
  })

  it('imports requested plugins from quasar/src/plugins.js', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('import { Notify,Dialog } from \'quasar/src/plugins.js\'')
  })

  it('imports lang and iconSet', () => {
    const contents = buildPluginContents(baseOpts)
    expect(contents).toContain('import lang from \'quasar/src/plugins/lang/Lang.js\'')
    expect(contents).toContain('import iconSet from \'quasar/src/plugins/icon-set/IconSet.js\'')
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

describe('buildPluginContents (iconLibraries option)', () => {
  const MATERIAL_ICONS_LINE = 'import \'@quasar/extras/material-icons/material-icons.css\''
  const MDI_LINE = 'import \'@quasar/extras/mdi-v7/mdi-v7.css\''
  const ANIMATION_LINE = 'import \'@quasar/extras/animate/fadeIn.css\''
  const CSS_LINE = 'import \'quasar/src/css/index.sass\''

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
