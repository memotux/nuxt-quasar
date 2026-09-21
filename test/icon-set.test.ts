import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import {
  VALID_ICON_SETS,
  buildPluginContents,
  isSvgIconSet,
  validateIconSet,
  iconSetImportLine,
} from '../src/internal'
import { iconSetImport, makeBaseOpts, parseQuasarNamedImports } from './helpers/template-fixtures'
import { readShippedDir } from './helpers/drift'

const WEBFONT_ICON_SETS = [
  'bootstrap-icons',
  'eva-icons',
  'fontawesome-v5',
  'fontawesome-v6',
  'fontawesome-v7',
  'ionicons-v4',
  'line-awesome',
  'material-icons',
  'material-icons-outlined',
  'material-icons-round',
  'material-icons-sharp',
  'material-symbols-outlined',
  'material-symbols-rounded',
  'material-symbols-sharp',
  'mdi-v3',
  'mdi-v4',
  'mdi-v5',
  'mdi-v6',
  'mdi-v7',
  'themify',
]

const SVG_ICON_SETS = [
  'svg-bootstrap-icons',
  'svg-eva-icons',
  'svg-fontawesome-v5',
  'svg-fontawesome-v6',
  'svg-fontawesome-v7',
  'svg-ionicons-v4',
  'svg-ionicons-v5',
  'svg-ionicons-v6',
  'svg-ionicons-v7',
  'svg-ionicons-v8',
  'svg-line-awesome',
  'svg-material-icons',
  'svg-material-icons-outlined',
  'svg-material-icons-round',
  'svg-material-icons-sharp',
  'svg-material-symbols-outlined',
  'svg-material-symbols-rounded',
  'svg-material-symbols-sharp',
  'svg-mdi-v6',
  'svg-mdi-v7',
  'svg-themify',
]

const EXPECTED_ICON_SETS = [...WEBFONT_ICON_SETS, ...SVG_ICON_SETS].sort()

const PRO_ICON_SETS = ['fontawesome-v5-pro', 'fontawesome-v6-pro', 'fontawesome-v7-pro']

describe('VALID_ICON_SETS', () => {
  it('pins the 41 publicly licensed mappings shipped by quasar/icon-set/', () => {
    expect([...VALID_ICON_SETS]).toEqual(EXPECTED_ICON_SETS)
    expect(VALID_ICON_SETS).toHaveLength(41)
  })

  it('contains 20 webfont and 21 svg mappings', () => {
    expect(WEBFONT_ICON_SETS).toHaveLength(20)
    expect(SVG_ICON_SETS).toHaveLength(21)
    expect([...VALID_ICON_SETS].filter(name => name.startsWith('svg-'))).toHaveLength(21)
    expect([...VALID_ICON_SETS].filter(name => !name.startsWith('svg-'))).toHaveLength(20)
  })

  it('is sorted lexicographically, so did-you-mean scans are deterministic', () => {
    expect([...VALID_ICON_SETS]).toEqual([...VALID_ICON_SETS].sort())
  })

  it('excludes the Font Awesome Pro variants', () => {
    for (const pro of PRO_ICON_SETS) {
      expect((VALID_ICON_SETS as readonly string[]).includes(pro)).toBe(false)
    }
  })
})

describe('isSvgIconSet', () => {
  it('returns true for every svg-* mapping', () => {
    const svgNames = [...VALID_ICON_SETS].filter(name => name.startsWith('svg-'))
    expect(svgNames).toHaveLength(21)
    for (const name of svgNames) {
      expect(isSvgIconSet(name)).toBe(true)
    }
  })

  it('returns false for every webfont mapping', () => {
    const webfontNames = [...VALID_ICON_SETS].filter(name => !name.startsWith('svg-'))
    expect(webfontNames).toHaveLength(20)
    for (const name of webfontNames) {
      expect(isSvgIconSet(name)).toBe(false)
    }
  })

  it('returns false for unknown names without throwing', () => {
    expect(isSvgIconSet('not-a-real-set')).toBe(false)
    expect(isSvgIconSet('svg-not-a-real-set')).toBe(false)
    expect(isSvgIconSet('')).toBe(false)
  })
})

describe('validateIconSet', () => {
  it('accepts a valid webfont name', () => {
    expect(() => validateIconSet('mdi-v7')).not.toThrow()
  })

  it('accepts a valid svg name', () => {
    expect(() => validateIconSet('svg-mdi-v7')).not.toThrow()
  })

  it('accepts all 41 valid names', () => {
    for (const name of VALID_ICON_SETS) {
      expect(() => validateIconSet(name)).not.toThrow()
    }
  })

  it('throws on an unknown name with no close match, listing the valid mappings', () => {
    expect(() => validateIconSet('zzzzzzzzzzzzzzzzzzzz'))
      .toThrow(/unknown Quasar icon set.*zzzzzzzzzzzzzzzzzzzz/)
    expect(() => validateIconSet('zzzzzzzzzzzzzzzzzzzz'))
      .toThrow(/Valid icon sets:.*material-icons/)
    expect(() => validateIconSet('zzzzzzzzzzzzzzzzzzzz'))
      .not.toThrow(/did you mean/)
  })

  it('suggests the nearest valid name for a typo', () => {
    expect(() => validateIconSet('themifyy'))
      .toThrow(/did you mean 'themify'/)
    expect(() => validateIconSet('material-icon'))
      .toThrow(/did you mean 'material-icons'/)
  })

  it('rejects the all shorthand and explains that a single mapping is required', () => {
    expect(() => validateIconSet('all'))
      .toThrow(/'all' is not a valid icon set/)
    expect(() => validateIconSet('all'))
      .toThrow(/single/)
  })

  it('rejects an empty string and explains that a named mapping is required', () => {
    expect(() => validateIconSet(''))
      .toThrow(/iconSet.*(empty|required|named)/)
  })

  it('rejects an array and explains that only a single string is accepted', () => {
    expect(() => validateIconSet(['mdi-v7', 'fontawesome-v7'] as unknown as string))
      .toThrow(/single string/)
  })

  it('rejects an object and names the offending type', () => {
    expect(() => validateIconSet({ name: 'mdi-v7' } as unknown as string))
      .toThrow(/object/)
  })

  it('rejects a number and names the offending type', () => {
    expect(() => validateIconSet(42 as unknown as string))
      .toThrow(/number/)
  })

  it('rejects a boolean and names the offending type', () => {
    expect(() => validateIconSet(true as unknown as string))
      .toThrow(/boolean/)
  })

  it('rejects a Font Awesome Pro variant with the valid names and the css escape hatch', () => {
    expect(() => validateIconSet('fontawesome-v7-pro'))
      .toThrow(/fontawesome-v7-pro/)
    expect(() => validateIconSet('fontawesome-v7-pro'))
      .toThrow(/css/)
    expect(() => validateIconSet('fontawesome-v7-pro'))
      .toThrow(/Valid icon sets:.*material-icons/)
  })
})

describe('iconSetImportLine', () => {
  it('builds the exact import line for a webfont name', () => {
    expect(iconSetImportLine('mdi-v7'))
      .toBe('import iconSet from \'quasar/icon-set/mdi-v7.js\'')
  })

  it('builds the exact import line for an svg name', () => {
    expect(iconSetImportLine('svg-mdi-v7'))
      .toBe('import iconSet from \'quasar/icon-set/svg-mdi-v7.js\'')
  })

  it('throws on an unknown name', () => {
    expect(() => iconSetImportLine('not-a-real-set'))
      .toThrow(/unknown Quasar icon set/)
  })
})

describe('iconSet wiring into the generated plugin', () => {
  const baseOpts = makeBaseOpts()

  it('emits exactly one fontawesome-v7 icon-set import', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      iconSet: 'fontawesome-v7',
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
    })

    expect(contents).toContain(iconSetImport('fontawesome-v7'))
    expect(parseQuasarNamedImports(contents, 'iconSet', 'icon-set'))
      .toEqual([`import iconSet from 'quasar/icon-set/fontawesome-v7.js'`])
  })
})

describe('icon set drift guard', () => {
  it('matches the publicly licensed mappings shipped by quasar/icon-set/ exactly', async () => {
    const iconSetDir = fileURLToPath(new URL('../node_modules/quasar/icon-set', import.meta.url))
    const entries = await readShippedDir(iconSetDir)

    const shipped = entries
      .filter(name => name.endsWith('.js'))
      .map(name => name.slice(0, -'.js'.length))
      .filter(name => !PRO_ICON_SETS.includes(name))
      .sort()

    expect([...VALID_ICON_SETS].sort()).toEqual(shipped)
  })
})
