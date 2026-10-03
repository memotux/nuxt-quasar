import { describe, it, expect } from 'vitest'
import {
  GENERATED_LANG_ALIAS_FILES,
  GENERATED_LANG_MODERN,
  VALID_LANG,
  validateLang,
  langImportLine,
} from '../src/internal'
import { DEPRECATED_LANG_ALIASES } from '../src/internal/lang'

// Policy reconciliation against the generated upstream inventory: the typed list
// is exactly the modern index names; the deprecated aliases stay excluded.
// Pins the policy, not volatile upstream names.
const DEPRECATED_ALIASES: Record<string, string> = {
  'kur-CKB': 'ckb',
  'mm': 'my',
  'sr-CYR': 'sr-Cyrl',
}

describe('VALID_LANG', () => {
  it('is exactly the generated modern language inventory', () => {
    expect([...VALID_LANG].sort()).toEqual([...GENERATED_LANG_MODERN].sort())
  })

  it('keeps the deprecated alias map in sync with the generated alias inventory', () => {
    expect([...GENERATED_LANG_ALIAS_FILES].sort()).toEqual(Object.keys(DEPRECATED_ALIASES).sort())
    for (const [alias, modern] of Object.entries(DEPRECATED_ALIASES)) {
      expect(DEPRECATED_LANG_ALIASES.get(alias)).toBe(modern)
      expect((VALID_LANG as readonly string[])).not.toContain(alias)
    }
  })

  it('is sorted lexicographically, so did-you-mean scans are deterministic', () => {
    expect([...VALID_LANG]).toEqual([...VALID_LANG].sort())
  })

  it('excludes the deprecated aliases that re-export the modern names', () => {
    for (const alias of Object.keys(DEPRECATED_ALIASES)) {
      expect((VALID_LANG as readonly string[]).includes(alias)).toBe(false)
    }
  })
})

describe('validateLang', () => {
  it('accepts a valid name', () => {
    expect(() => validateLang('es')).not.toThrow()
  })

  it('accepts every curated name', () => {
    for (const name of VALID_LANG) {
      expect(() => validateLang(name)).not.toThrow()
    }
  })

  it('throws on an unknown name with no close match, listing the valid packs', () => {
    expect(() => validateLang('zzzzzzzzzzzzzzzzzzzz'))
      .toThrow(/unknown Quasar language pack: 'zzzzzzzzzzzzzzzzzzzz'/)
    expect(() => validateLang('zzzzzzzzzzzzzzzzzzzz'))
      .toThrow(/Valid language packs: ar, ar-TN/)
    expect(() => validateLang('zzzzzzzzzzzzzzzzzzzz'))
      .not.toThrow(/did you mean/)
  })

  it('suggests the nearest valid name for a typo', () => {
    // es-MX is 2 edits from ms-MY but 3 from es, so pure Levenshtein picks ms-MY.
    // See apply-progress.md: the spec example assumed 'es', but 'ms-MY' is the
    // true closest valid name; the requirement is "the closest valid name".
    expect(() => validateLang('es-MX'))
      .toThrow(/did you mean 'ms-MY'/)
    expect(() => validateLang('zhh-CN'))
      .toThrow(/did you mean 'zh-CN'/)
    expect(() => validateLang('frr'))
      .toThrow(/did you mean 'fr'/)
  })

  it('rejects the all shorthand and explains that a single named pack is required', () => {
    expect(() => validateLang('all'))
      .toThrow(/'all' is not a valid/)
    expect(() => validateLang('all'))
      .toThrow(/single/)
  })

  it('rejects an empty string and explains that a named pack is required', () => {
    expect(() => validateLang(''))
      .toThrow(/lang.*(empty|required|named)/)
  })

  it('rejects an array and explains that only a single string is accepted', () => {
    expect(() => validateLang(['es', 'en-US'] as unknown as string))
      .toThrow(/single string/)
  })

  it('rejects an object and names the offending type', () => {
    expect(() => validateLang({ name: 'es' } as unknown as string))
      .toThrow(/object/)
  })

  it('rejects a number and names the offending type', () => {
    expect(() => validateLang(42 as unknown as string))
      .toThrow(/number/)
  })

  it('rejects a boolean and names the offending type', () => {
    expect(() => validateLang(true as unknown as string))
      .toThrow(/boolean/)
  })

  it('rejects a deprecated alias with the modern name and the valid pack list', () => {
    for (const [alias, modern] of Object.entries(DEPRECATED_ALIASES)) {
      expect(() => validateLang(alias)).toThrow(new RegExp(alias))
      expect(() => validateLang(alias)).toThrow(new RegExp(`'${modern}'`))
      expect(() => validateLang(alias)).toThrow(/Valid language packs: ar, ar-TN/)
    }
  })
})

describe('langImportLine', () => {
  it('builds the exact import line for a valid name', () => {
    expect(langImportLine('es'))
      .toBe('import lang from \'quasar/lang/es.js\'')
  })

  it('builds the exact import line for a region-tagged name', () => {
    expect(langImportLine('pt-BR'))
      .toBe('import lang from \'quasar/lang/pt-BR.js\'')
  })

  it('throws on an unknown name', () => {
    expect(() => langImportLine('not-a-real-lang'))
      .toThrow(/unknown Quasar language pack/)
  })
})

describe('lang drift guard', () => {
  it('reconciles the curated list with the generated upstream snapshot', () => {
    // The generated module is pinned against quasar/lang/index.json and the
    // lang dir by test/generate-quasar-lists.test.ts; this guard only
    // reconciles the handwritten policy (alias exclusion) with that source.
    expect([...VALID_LANG].sort()).toEqual([...GENERATED_LANG_MODERN].sort())
    expect([...DEPRECATED_LANG_ALIASES.keys()].sort())
      .toEqual([...GENERATED_LANG_ALIAS_FILES].sort())
  })
})
