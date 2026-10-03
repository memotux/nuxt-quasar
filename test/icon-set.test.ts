import { describe, it, expect } from 'vitest'
import {
  GENERATED_ICON_SETS_SHIPPED,
  VALID_ICON_SETS,
  buildPluginContents,
  isSvgIconSet,
  validateIconSet,
  iconSetImportLine,
} from '../src/internal'
import { iconSetImport, makeBaseOpts, parseQuasarNamedImports } from './helpers/template-fixtures'

const PRO_ICON_SETS = ['fontawesome-v5-pro', 'fontawesome-v6-pro', 'fontawesome-v7-pro']

// Policy reconciliation against the generated upstream inventory: the typed
// list is the shipped files minus the paid Pro variants, with no other
// additions or removals. Pins the policy, not volatile upstream names.
const EXPECTED_ICON_SETS = [...GENERATED_ICON_SETS_SHIPPED]
  .filter(name => !PRO_ICON_SETS.includes(name))

describe('VALID_ICON_SETS', () => {
  it('is the generated shipped inventory minus the Pro policy exclusions', () => {
    expect([...VALID_ICON_SETS].sort()).toEqual([...EXPECTED_ICON_SETS].sort())
    // Every curated name is still shipped upstream: an upstream removal must
    // fail here rather than silently validating a name Quasar dropped.
    for (const name of VALID_ICON_SETS) {
      expect(GENERATED_ICON_SETS_SHIPPED).toContain(name)
    }
  })

  it('splits into svg-* and webfont names with no overlap', () => {
    const svg = [...VALID_ICON_SETS].filter(name => name.startsWith('svg-'))
    const webfont = [...VALID_ICON_SETS].filter(name => !name.startsWith('svg-'))
    expect(svg.length + webfont.length).toBe(VALID_ICON_SETS.length)
    expect(new Set(VALID_ICON_SETS).size).toBe(VALID_ICON_SETS.length)
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
    expect(svgNames.length).toBeGreaterThan(0)
    for (const name of svgNames) {
      expect(isSvgIconSet(name)).toBe(true)
    }
  })

  it('returns false for every webfont mapping', () => {
    const webfontNames = [...VALID_ICON_SETS].filter(name => !name.startsWith('svg-'))
    expect(webfontNames.length).toBeGreaterThan(0)
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

  it('accepts every curated name', () => {
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
  it('reconciles the curated list with the generated upstream snapshot', () => {
    // The generated module is pinned against quasar/icon-set/ by
    // test/generate-quasar-lists.test.ts; this guard only reconciles the
    // handwritten policy (Pro exclusion) with that shared source.
    const shipped = [...GENERATED_ICON_SETS_SHIPPED].sort()
    const curated = [...VALID_ICON_SETS].sort()
    expect(curated).toEqual(shipped.filter(name => !PRO_ICON_SETS.includes(name)))
    // The policy pins exactly which upstream names are excluded: no silent
    // widening of the exclusion set on upstream additions.
    expect(shipped.filter(name => !curated.includes(name)).sort()).toEqual([...PRO_ICON_SETS].sort())
  })
})
