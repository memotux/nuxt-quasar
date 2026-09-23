import { describe, expect, it } from 'vitest'
import { QUASAR_INTERNALS_DTS, VALID_PLUGINS } from '../src/internal'

describe('QUASAR_INTERNALS_DTS (generated .nuxt ambient declarations)', () => {
  it('declares the three Quasar internals the generated plugin imports', () => {
    for (const specifier of [
      'quasar/src/install-quasar.js',
      'quasar/src/plugins.js',
      'quasar/src/directives.js',
    ]) {
      expect(QUASAR_INTERNALS_DTS).toContain(`declare module '${specifier}'`)
    }
  })

  it('declares the css side-effect module so the sass import type-checks', () => {
    expect(QUASAR_INTERNALS_DTS).toContain(`declare module 'quasar/src/css/index.sass'`)
  })

  it('exports every valid plugin name so `import { <name> }` resolves', () => {
    // Derived from VALID_PLUGINS: if the list grows, the declaration must too.
    for (const name of VALID_PLUGINS) {
      expect(QUASAR_INTERNALS_DTS).toContain(`export const ${name}: unknown`)
    }
  })

  it('declares a default export for install-quasar', () => {
    expect(QUASAR_INTERNALS_DTS).toContain('export default installQuasar')
  })
})
