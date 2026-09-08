import { describe, it, expect } from 'vitest'
import { buildPluginContents } from '../src/internal'

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
