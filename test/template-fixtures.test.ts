import { describe, it, expect } from 'vitest'
import { parseQuasarNamedImports } from './helpers/template-fixtures'

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
