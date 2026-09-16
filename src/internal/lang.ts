import { levenshteinDistance } from './levenshtein'

/**
 * The modern language packs shipped by `quasar@2.27.0` under `quasar/lang/`.
 *
 * Deliberately excludes the 3 deprecated aliases (`kur-CKB`, `mm`, `sr-CYR`)
 * that re-export the modern names: Quasar's own docs recommend the modern
 * names, so shipping the deprecated paths in the typed list would validate
 * configuration Quasar flags as legacy. Use a manual `Lang.set(...)` boot
 * file if you really need an alias.
 */
export const VALID_LANG = [
  'ar',
  'ar-TN',
  'az-Latn',
  'bg',
  'bn',
  'bs-BA',
  'ca',
  'ckb',
  'cs',
  'da',
  'de',
  'de-CH',
  'de-DE',
  'el',
  'en-GB',
  'en-US',
  'eo',
  'es',
  'et',
  'eu',
  'fa',
  'fa-IR',
  'fi',
  'fr',
  'gn',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'is',
  'it',
  'ja',
  'kk',
  'km',
  'ko-KR',
  'lb',
  'lt',
  'lu',
  'lv',
  'mk',
  'ml',
  'ms',
  'ms-MY',
  'my',
  'nb-NO',
  'nl',
  'pl',
  'pt',
  'pt-BR',
  'ro',
  'ru',
  'sk',
  'sl',
  'sm',
  'sq',
  'sr',
  'sr-Cyrl',
  'sv',
  'ta',
  'th',
  'tl',
  'tr',
  'ug',
  'uk',
  'ur-PK',
  'uz-Cyrl',
  'uz-Latn',
  'vi',
  'zh-CN',
  'zh-TW',
] as const

export type QuasarLang = typeof VALID_LANG[number]

/** Deprecated aliases shipped by Quasar for backwards compat; mapped to the modern names, filtered from drift. */
export const DEPRECATED_LANG_ALIASES: ReadonlyMap<string, string> = new Map([
  ['kur-CKB', 'ckb'],
  ['mm', 'my'],
  ['sr-CYR', 'sr-Cyrl'],
])

/**
 * Validate a single language-pack name. Quasar supports exactly one active
 * Language Pack, so arrays, objects, non-strings, the empty string and the
 * `'all'` shorthand are all rejected with explicit errors. Unknown names get
 * a did-you-mean hint; deprecated aliases get pointed at their modern names.
 */
export function validateLang(name: string): void {
  if (Array.isArray(name) || typeof name !== 'string') {
    throw new TypeError(
      `nuxt-quasar-vite: lang must be a single string, got ${Array.isArray(name) ? 'an array' : `a ${typeof name}`}. `
      + 'Pass one language pack name (e.g. \'es\').',
    )
  }
  if (name === '') {
    throw new Error(
      'nuxt-quasar-vite: lang is empty; a named language pack is required (e.g. \'es\').',
    )
  }
  if ((VALID_LANG as readonly string[]).includes(name)) return
  if (name === 'all') {
    throw new Error(
      'nuxt-quasar-vite: lang \'all\' is not a valid language pack; only a single named pack '
      + 'is accepted (e.g. \'es\').',
    )
  }
  if (DEPRECATED_LANG_ALIASES.has(name)) {
    const modern = DEPRECATED_LANG_ALIASES.get(name)!
    throw new Error(
      `nuxt-quasar-vite: unknown Quasar language pack: '${name}'. It is a deprecated alias kept for `
      + `backwards compatibility; use the modern name '${modern}' instead. `
      + `Valid language packs: ${VALID_LANG.join(', ')}`,
    )
  }

  const nearest = VALID_LANG.reduce((best, candidate) => {
    return levenshteinDistance(name, candidate) < levenshteinDistance(name, best) ? candidate : best
  })
  const suggestion = levenshteinDistance(name, nearest) <= 3
    ? ` (did you mean '${nearest}'?)`
    : ''
  throw new Error(
    `nuxt-quasar-vite: unknown Quasar language pack: '${name}'${suggestion}. `
    + `Valid language packs: ${VALID_LANG.join(', ')}`,
  )
}

/**
 * Build the plugin-template import line for a language pack:
 * `import lang from 'quasar/lang/<iso>.js'`.
 */
export function langImportLine(name: string): string {
  validateLang(name)
  return `import lang from 'quasar/lang/${name}.js'`
}
