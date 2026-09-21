import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
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
import { readShippedDir } from './helpers/drift'

const EXPECTED_ICON_LIBRARIES = [
  'bootstrap-icons',
  'eva-icons',
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
  'mdi-v7',
  'themify',
]

describe('VALID_ICON_LIBRARIES', () => {
  it('pins the 14 CSS icon font libraries shipped by @quasar/extras', () => {
    expect([...VALID_ICON_LIBRARIES]).toEqual(EXPECTED_ICON_LIBRARIES)
    expect(VALID_ICON_LIBRARIES).toHaveLength(14)
  })

  it('is sorted, so did-you-mean scans are deterministic', () => {
    expect([...VALID_ICON_LIBRARIES]).toEqual([...VALID_ICON_LIBRARIES].sort())
  })

  it('derives the legacy CSS path for every accepted library', () => {
    expect(ICON_LIBRARY_CSS_PATHS.size).toBe(14)
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

  it('accepts all 14 valid library names', () => {
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

  it('builds one specifier for each of the 14 accepted libraries', () => {
    const imports = buildIconLibraryImports([...VALID_ICON_LIBRARIES])
    expect(imports).toHaveLength(14)
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
  it('matches the CSS icon font libraries shipped by @quasar/extras exactly', async () => {
    const extrasDir = dirname(dirname(fileURLToPath(new URL('../node_modules/@quasar/extras/exports/animate/animate-list.js', import.meta.url))))
    const entries = await readShippedDir(extrasDir, { withFileTypes: true })

    // Find directories that contain <name>/<name>.css — these are the CSS icon font libraries.
    const cssIconLibraries: string[] = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const name = entry.name
      const dirContents = await readShippedDir(join(extrasDir, name))
      if (dirContents.includes(`${name}.css`)) {
        cssIconLibraries.push(name)
      }
    }

    // Exclude known non-icon entries (fonts, SVG-only, etc.)
    const nonIconEntries = ['roboto-font', 'roboto-font-latin-ext', 'ionicons-v8']
    const expectedCssIconLibraries = cssIconLibraries
      .filter(name => !nonIconEntries.includes(name))
      .sort()

    expect([...VALID_ICON_LIBRARIES].sort()).toEqual(expectedCssIconLibraries)
  })
})
