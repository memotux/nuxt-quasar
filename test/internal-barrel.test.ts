import { describe, it, expect } from 'vitest'
import * as Barrel from '../src/internal'

/**
 * Runtime surface of `src/internal`. Keep this list in sync with `src/internal/*.ts`.
 * Types and interfaces are TypeScript-level and are checked by `pnpm test:types`,
 * not by this list. Adding a new runtime export anywhere in `src/internal/*`
 * requires updating this list — that is the point of the drift guard.
 */
const EXPECTED_RUNTIME_EXPORTS = [
  // animations.ts
  'GENERAL_ANIMATIONS',
  'IN_ANIMATIONS',
  'OUT_ANIMATIONS',
  'VALID_ANIMATIONS',
  'KNOWN_ORPHAN_ANIMATIONS',
  'normalizeAnimations',
  'validateAnimations',
  'buildAnimationImports',
  // component-dir.ts
  'buildComponentDir',
  // define-matrix.ts
  'buildDefineMatrix',
  // icon-libraries.ts
  'VALID_ICON_LIBRARIES',
  'ICON_LIBRARY_CSS_PATHS',
  'normalizeIconLibraries',
  'validateIconLibraries',
  'buildIconLibraryImports',
  'warnLegacyIconCss',
  // icon-set.ts
  'VALID_ICON_SETS',
  'isSvgIconSet',
  'validateIconSet',
  'iconSetImportLine',
  // import-presets.ts
  'buildImportPresets',
  // lang.ts
  'VALID_LANG',
  'DEPRECATED_LANG_ALIASES',
  'validateLang',
  'langImportLine',
  // levenshtein.ts — deliberately NOT on the barrel. `levenshteinDistance` is
  // an internal helper consumed only by the validators. Exercised directly by
  // `test/levenshtein.test.ts` (deep import) and indirectly via `nearestSuggestion`.
  // merge-preprocessor-options.ts
  'mergeScssOptions',
  'mergeSassOptions',
  // plugin-template.ts
  'buildPluginContents',
  // plugins.ts
  'VALID_PLUGINS',
  'validatePlugins',
  // sass-imports.ts
  'buildSassImportCode',
  // validation.ts
  'nearestSuggestion',
  'validateSingleValue',
  'validateArrayValues',
] as const

describe('src/internal barrel', () => {
  it.each(EXPECTED_RUNTIME_EXPORTS)('exports %s', (name) => {
    expect(Barrel).toHaveProperty(name)
  })

  it('only exports names listed in EXPECTED_RUNTIME_EXPORTS (drift guard)', () => {
    const actual = Object.keys(Barrel).sort()
    const expected = [...EXPECTED_RUNTIME_EXPORTS].sort()
    expect(actual).toEqual(expected)
  })

  it('exports functions as functions and constants as their declared shapes', () => {
    // Spot-check shape so an accidental re-export-of-undefined is caught
    // even if the property exists.
    expect(typeof Barrel.validatePlugins).toBe('function')
    expect(typeof Barrel.nearestSuggestion).toBe('function')
    expect(typeof Barrel.buildPluginContents).toBe('function')
    expect(typeof Barrel.warnLegacyIconCss).toBe('function')
    expect(Array.isArray(Barrel.VALID_PLUGINS)).toBe(true)
    expect(Array.isArray(Barrel.VALID_ANIMATIONS)).toBe(true)
    expect(Array.isArray(Barrel.VALID_ICON_SETS)).toBe(true)
    expect(Array.isArray(Barrel.VALID_LANG)).toBe(true)
    expect(Array.isArray(Barrel.VALID_ICON_LIBRARIES)).toBe(true)
    expect(Barrel.ICON_LIBRARY_CSS_PATHS).toBeInstanceOf(Set)
  })
})
