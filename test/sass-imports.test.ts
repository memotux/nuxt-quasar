import { describe, it, expect } from 'vitest'
import { buildSassImportCode } from '../src/internal'

describe('buildSassImportCode (F3: sassVariables branching)', () => {
  it('false produces an empty array (no imports)', () => {
    expect(buildSassImportCode(false)).toEqual([])
  })

  it('true produces the default Quasar variables import', () => {
    const result = buildSassImportCode(true)
    expect(result).toEqual([
      '@import \'quasar/src/css/variables.sass\'',
      '',
    ])
  })

  it('string prepends custom path before Quasar variables import', () => {
    const result = buildSassImportCode('src/assets/my-variables.sass')
    expect(result).toEqual([
      '@import \'src/assets/my-variables.sass\'',
      '@import \'quasar/src/css/variables.sass\'',
      '',
    ])
  })

  it('string path appears first (unshift), Quasar variables second', () => {
    const result = buildSassImportCode('custom.scss')
    expect(result[0]).toContain('custom.scss')
    expect(result[1]).toContain('quasar/src/css/variables.sass')
  })

  it('joined with semicolon-newline produces correct SCSS additionalData', () => {
    const result = buildSassImportCode(true)
    const joined = result.join(';\n')
    expect(joined).toBe('@import \'quasar/src/css/variables.sass\';\n')
  })

  it('joined with semicolon-newline for string path produces correct SCSS additionalData', () => {
    const result = buildSassImportCode('my-vars.scss')
    const joined = result.join(';\n')
    expect(joined).toBe('@import \'my-vars.scss\';\n@import \'quasar/src/css/variables.sass\';\n')
  })

  it('joined with newline produces correct Sass additionalData', () => {
    const result = buildSassImportCode(true)
    const joined = result.join('\n')
    expect(joined).toBe('@import \'quasar/src/css/variables.sass\'\n')
  })

  it('empty string is falsy and produces empty array', () => {
    // In the module, the check is `if (opts.sassVariables)` — empty string is falsy
    expect(buildSassImportCode('')).toEqual([])
  })
})
