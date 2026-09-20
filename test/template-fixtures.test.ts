import { describe, it, expect } from 'vitest'
import { parseQuasarNamedImports, parseSideEffectImports } from './helpers/template-fixtures'

describe('parseQuasarNamedImports (helper contract)', () => {
  it('extracts exact well-formed statements, one per line', () => {
    const contents = [
      `import installQ from 'quasar/src/install-quasar.js'`,
      `import iconSet from 'quasar/icon-set/mdi-v7.js'`,
      `import lang from 'quasar/lang/es.js'`,
    ].join('\n')
    expect(parseQuasarNamedImports(contents, 'iconSet', 'icon-set'))
      .toEqual([`import iconSet from 'quasar/icon-set/mdi-v7.js'`])
    expect(parseQuasarNamedImports(contents, 'lang', 'lang'))
      .toEqual([`import lang from 'quasar/lang/es.js'`])
  })

  it('returns [] when no statement matches (the old fragment count could still see 1)', () => {
    // Discrimination, encoded permanently: a commented-out import line and a
    // stray path fragment inside a string literal both satisfy the OLD
    // /quasar\/icon-set\//g count but must yield zero parsed statements.
    const contents = [
      `// import iconSet from 'quasar/icon-set/mdi-v7.js'`,
      `const note = 'see quasar/icon-set/ docs'`,
    ].join('\n')
    expect(parseQuasarNamedImports(contents, 'iconSet', 'icon-set')).toEqual([])
  })

  it('requires the .js extension and the exact import form (malformed lines do not match)', () => {
    const contents = [
      `import iconSet of 'quasar/icon-set/mdi-v7.js'`, // wrong keyword
      `import iconSet from 'quasar/icon-set/mdi-v7'`, // missing .js
      `import iconset from 'quasar/icon-set/mdi-v7.js'`, // wrong name case
    ].join('\n')
    expect(parseQuasarNamedImports(contents, 'iconSet', 'icon-set')).toEqual([])
  })
})

describe('parseSideEffectImports (helper contract)', () => {
  it('extracts exact well-formed side-effect statements, scoped by prefix', () => {
    const contents = [
      `import '@quasar/extras/animate/fadeIn.css'`,
      `import '@quasar/extras/mdi-v7/mdi-v7.css'`,
      `import 'quasar/src/css/index.sass'`,
    ].join('\n')
    expect(parseSideEffectImports(contents, '@quasar/extras/animate/'))
      .toEqual([`import '@quasar/extras/animate/fadeIn.css'`])
    expect(parseSideEffectImports(contents, '@quasar/extras/mdi-v7/'))
      .toEqual([`import '@quasar/extras/mdi-v7/mdi-v7.css'`])
    expect(parseSideEffectImports(contents, 'quasar/src/css/'))
      .toEqual([`import 'quasar/src/css/index.sass'`])
  })

  it('returns [] for commented-out lines and stray fragments (the old count still saw 1)', () => {
    const contents = [
      `// import '@quasar/extras/animate/fadeIn.css'`,
      `const note = 'see @quasar/extras/animate/ docs'`,
    ].join('\n')
    expect(parseSideEffectImports(contents, '@quasar/extras/animate/')).toEqual([])
  })
})
