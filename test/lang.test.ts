import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import {
  VALID_LANG,
  validateLang,
  langImportLine,
} from '../src/internal'
import { DEPRECATED_LANG_ALIASES } from '../src/internal/lang'
import { readShippedDir } from './helpers/drift'

// The 71 modern language packs shipped by quasar@2.27.0 under quasar/lang/,
// in lexicographic order. Deliberately excludes the 3 deprecated aliases
// (kur-CKB, mm, sr-CYR) that re-export the modern names.
const EXPECTED_LANG = [
  'ar', 'ar-TN', 'az-Latn', 'bg', 'bn', 'bs-BA', 'ca', 'ckb', 'cs', 'da',
  'de', 'de-CH', 'de-DE', 'el', 'en-GB', 'en-US', 'eo', 'es', 'et', 'eu',
  'fa', 'fa-IR', 'fi', 'fr', 'gn', 'he', 'hi', 'hr', 'hu', 'id',
  'is', 'it', 'ja', 'kk', 'km', 'ko-KR', 'lb', 'lt', 'lu', 'lv',
  'mk', 'ml', 'ms', 'ms-MY', 'my', 'nb-NO', 'nl', 'pl', 'pt', 'pt-BR',
  'ro', 'ru', 'sk', 'sl', 'sm', 'sq', 'sr', 'sr-Cyrl', 'sv', 'ta',
  'th', 'tl', 'tr', 'ug', 'uk', 'ur-PK', 'uz-Cyrl', 'uz-Latn', 'vi', 'zh-CN',
  'zh-TW',
]

const DEPRECATED_ALIASES: Record<string, string> = {
  'kur-CKB': 'ckb',
  'mm': 'my',
  'sr-CYR': 'sr-Cyrl',
}

describe('VALID_LANG', () => {
  it('pins the 71 modern language packs shipped by quasar/lang/', () => {
    expect([...VALID_LANG]).toEqual(EXPECTED_LANG)
    expect(VALID_LANG).toHaveLength(71)
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

  it('accepts all 71 valid names', () => {
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
  it('matches the modern language packs shipped by quasar/lang/ exactly, excluding deprecated aliases and index.json', async () => {
    const langDir = fileURLToPath(new URL('../node_modules/quasar/lang', import.meta.url))
    const entries = await readShippedDir(langDir)

    const shipped = entries
      .filter(name => name.endsWith('.js'))
      .map(name => name.slice(0, -'.js'.length))
      .filter(name => !DEPRECATED_LANG_ALIASES.has(name))
      .sort()

    expect([...VALID_LANG].sort()).toEqual(shipped)
  })
})
