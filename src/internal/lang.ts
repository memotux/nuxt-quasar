import { validateSingleValue } from './validation'

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
 * Build the full rejection message for a deprecated language alias.
 */
function deprecatedLangMessage(alias: string, modern: string): string {
  return `unknown Quasar language pack: '${alias}'. It is a deprecated alias kept for backwards compatibility; use the modern name '${modern}' instead. Valid language packs: ${VALID_LANG.join(', ')}`
}

/** Pre-built exclusion map for deprecated aliases. */
const LANG_EXCLUSIONS: ReadonlyMap<string, string> = new Map(
  [...DEPRECATED_LANG_ALIASES].map(([alias, modern]) => [alias, deprecatedLangMessage(alias, modern)]),
)

/**
 * Validate a single language-pack name. Quasar supports exactly one active
 * Language Pack, so arrays, objects, non-strings, the empty string and the
 * `'all'` shorthand are all rejected with explicit errors. Unknown names get
 * a did-you-mean hint; deprecated aliases get pointed at their modern names.
 */
export function validateLang(name: unknown): void {
  validateSingleValue(name, {
    validList: VALID_LANG,
    field: 'lang',
    domain: 'language pack',
    example: 'es',
    allMessage: '\'all\' is not a valid language pack; only a single named pack is accepted (e.g. \'es\').',
    exclusions: LANG_EXCLUSIONS,
  })
}

/**
 * Build the plugin-template import line for a language pack:
 * `import lang from 'quasar/lang/<iso>.js'`.
 */
export function langImportLine(name: string): string {
  validateLang(name)
  return `import lang from 'quasar/lang/${name}.js'`
}
