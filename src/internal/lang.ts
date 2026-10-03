import { GENERATED_LANG_ALIAS_FILES, GENERATED_LANG_MODERN } from './generated-quasar-lists'
import { validateSingleValue } from './validation'

/**
 * Policy exclusions applied on top of the generated upstream inventory:
 * the deprecated aliases re-export the modern names, and Quasar's own docs
 * recommend the modern names, so shipping them in the typed list would
 * validate configuration Quasar flags as legacy. Use a manual `Lang.set(...)`
 * boot file if you really need an alias.
 */
export const VALID_LANG = [...GENERATED_LANG_MODERN] as const

export type QuasarLang = typeof VALID_LANG[number]

/** Deprecated aliases shipped by Quasar for backwards compat; mapped to the modern names, filtered from drift. Asserted against the generator's alias inventory. */
export const DEPRECATED_LANG_ALIASES: ReadonlyMap<string, string> = new Map([
  ['kur-CKB', 'ckb'],
  ['mm', 'my'],
  ['sr-CYR', 'sr-Cyrl'],
])

const generatedAliasSet = new Set<string>(GENERATED_LANG_ALIAS_FILES as readonly string[])
for (const alias of DEPRECATED_LANG_ALIASES.keys()) {
  if (!generatedAliasSet.has(alias)) {
    throw new Error(
      `nuxt-quasar-vite: deprecated language alias '${alias}' is missing from the generated snapshot; `
      + `regenerate the snapshot and update the curated map`,
    )
  }
}

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
