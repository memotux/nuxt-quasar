import { describe, it, expect } from 'vitest'
import {
  GENERATED_ICON_LIBRARIES_SHIPPED,
  VALID_ICON_LIBRARIES,
  buildIconLibraryImports,
  buildPluginContents,
  normalizeIconLibraries,
  validateIconLibraries,
} from '../src/internal'
import { ICON_LIBRARY_CSS_PATHS } from '../src/internal/icon-libraries'
import {
  CSS_SPECIFIER,
  makeBaseOpts,
  parseSideEffectImports,
} from './helpers/template-fixtures'

// Policy reconciliation against the generated upstream inventory: the typed list
// is the shipped css dirs minus the text fonts, with no other additions or
// removals. Pins the policy, not volatile upstream names.
const EXCLUDED_ICON_LIBRARIES = ['roboto-font', 'roboto-font-latin-ext']
const EXPECTED_ICON_LIBRARIES = [...GENERATED_ICON_LIBRARIES_SHIPPED]
  .filter(name => !EXCLUDED_ICON_LIBRARIES.includes(name))

describe('VALID_ICON_LIBRARIES', () => {
  it('is the generated shipped inventory minus the non-font policy exclusions', () => {
    expect([...VALID_ICON_LIBRARIES].sort()).toEqual([...EXPECTED_ICON_LIBRARIES].sort())
    // Every curated name is still shipped upstream: an upstream removal must
    // fail here rather than silently validating a name extras dropped.
    for (const name of VALID_ICON_LIBRARIES) {
      expect(GENERATED_ICON_LIBRARIES_SHIPPED).toContain(name)
    }
  })

  it('is sorted, so did-you-mean scans are deterministic', () => {
    expect([...VALID_ICON_LIBRARIES]).toEqual([...VALID_ICON_LIBRARIES].sort())
  })

  it('derives the legacy CSS path for every accepted library', () => {
    expect(ICON_LIBRARY_CSS_PATHS.size).toBe(VALID_ICON_LIBRARIES.length)
    expect(ICON_LIBRARY_CSS_PATHS.has('@quasar/extras/material-icons/material-icons.css')).toBe(true)
    expect(ICON_LIBRARY_CSS_PATHS.has('@quasar/extras/mdi-v7/mdi-v7.css')).toBe(true)
    expect(ICON_LIBRARY_CSS_PATHS.has('@quasar/extras/animate/fadeIn.css')).toBe(false)
  })
})

describe('normalizeIconLibraries', () => {
  it('normalizes undefined to an empty array', () => {
    expect(normalizeIconLibraries()).toEqual([])
  })

  it('keeps an explicitly empty selection empty', () => {
    expect(normalizeIconLibraries([])).toEqual([])
  })

  it('drops falsy entries and emits duplicates once', () => {
    expect(normalizeIconLibraries(['material-icons', '', 'material-icons', 'mdi-v7']))
      .toEqual(['material-icons', 'mdi-v7'])
  })

  it('normalizes an all-falsy selection to an empty array', () => {
    expect(normalizeIconLibraries(['', ''])).toEqual([])
  })

  it('preserves the configured order', () => {
    expect(normalizeIconLibraries(['themify', 'eva-icons']))
      .toEqual(['themify', 'eva-icons'])
  })
})

describe('validateIconLibraries', () => {
  it('accepts valid library names', () => {
    expect(() => validateIconLibraries(['material-icons', 'mdi-v7'])).not.toThrow()
  })

  it('accepts every curated library name', () => {
    expect(() => validateIconLibraries([...VALID_ICON_LIBRARIES])).not.toThrow()
  })

  it('accepts an empty selection', () => {
    expect(() => validateIconLibraries([])).not.toThrow()
  })

  it('throws on an unknown name with no close match', () => {
    expect(() => validateIconLibraries(['zzzzzzzzzzzzzzzzzzzz']))
      .toThrow(/unknown Quasar icon librar.*zzzzzzzzzzzzzzzzzzzz/)
  })

  it('reports every invalid name at once', () => {
    expect(() => validateIconLibraries(['Foo', 'Bar'])).toThrow(/Foo.*Bar/)
  })

  it('suggests the nearest valid name for a typo', () => {
    expect(() => validateIconLibraries(['material-icon']))
      .toThrow(/did you mean 'material-icons'/)
  })

  it('rejects the all shorthand and names it in the error', () => {
    expect(() => validateIconLibraries(['all'])).toThrow(/'all'/)
    expect(() => validateIconLibraries(['all'])).toThrow(/unknown Quasar icon librar/)
  })

  it('lists the valid names so the failure is actionable', () => {
    expect(() => validateIconLibraries(['not-a-library']))
      .toThrow(/Valid icon libraries:.*material-icons/)
  })
})

describe('buildIconLibraryImports', () => {
  it('builds exact @quasar/extras/<name>/<name>.css import specifiers', () => {
    expect(buildIconLibraryImports(['material-icons', 'mdi-v7'])).toEqual([
      'import \'@quasar/extras/material-icons/material-icons.css\'',
      'import \'@quasar/extras/mdi-v7/mdi-v7.css\'',
    ])
  })

  it('builds one specifier for each accepted library', () => {
    const imports = buildIconLibraryImports([...VALID_ICON_LIBRARIES])
    expect(imports).toHaveLength(VALID_ICON_LIBRARIES.length)
    expect(imports).toContain('import \'@quasar/extras/themify/themify.css\'')
    expect(imports).toContain('import \'@quasar/extras/bootstrap-icons/bootstrap-icons.css\'')
  })

  it('builds no specifiers for an empty selection', () => {
    expect(buildIconLibraryImports([])).toEqual([])
  })
})

describe('iconLibraries wiring into the generated plugin', () => {
  const baseOpts = makeBaseOpts({ css: [CSS_SPECIFIER, '~/assets/custom.sass'] })

  it('emits one import per normalized selection', () => {
    const contents = buildPluginContents({
      ...baseOpts,
      iconLibraries: normalizeIconLibraries(['mdi-v7', '', 'themify', 'mdi-v7']),
    })

    expect(contents).toContain('import \'@quasar/extras/mdi-v7/mdi-v7.css\'')
    expect(contents).toContain('import \'@quasar/extras/themify/themify.css\'')
    expect(parseSideEffectImports(contents, '@quasar/extras/mdi-v7/'))
      .toEqual([`import '@quasar/extras/mdi-v7/mdi-v7.css'`])
  })
})

describe('icon libraries drift guard', () => {
  it('reconciles the curated list with the generated upstream snapshot', () => {
    // The generated module is pinned against the @quasar/extras export dirs
    // by test/generate-quasar-lists.test.ts; this guard only reconciles the
    // handwritten policy (font/svg exclusions) with that shared source.
    const shipped = [...GENERATED_ICON_LIBRARIES_SHIPPED].sort()
    const curated = [...VALID_ICON_LIBRARIES].sort()
    expect(curated).toEqual(shipped.filter(name => !EXCLUDED_ICON_LIBRARIES.includes(name)))
    // The policy pins exactly which upstream names are excluded: no silent
    // widening of the exclusion set on upstream additions.
    expect(shipped.filter(name => !curated.includes(name)).sort()).toEqual([...EXCLUDED_ICON_LIBRARIES].sort())
  })
})
