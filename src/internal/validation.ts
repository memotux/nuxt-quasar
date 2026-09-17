import { levenshteinDistance } from './levenshtein'

/**
 * Find the nearest valid name by Levenshtein distance, returning a
 * `(did you mean 'X'?)` hint when the distance is ≤ 3.
 */
export function nearestSuggestion(name: string, validList: readonly string[]): string {
  const nearest = validList.reduce((best, candidate) =>
    levenshteinDistance(name, candidate) < levenshteinDistance(name, best) ? candidate : best,
  )
  return levenshteinDistance(name, nearest) <= 3
    ? ` (did you mean '${nearest}'?)`
    : ''
}

/**
 * Options for single-value validation (lang, iconSet).
 */
export interface SingleValidatorOptions {
  /** List of valid names */
  validList: readonly string[]
  /** Config field name, e.g. 'lang', 'iconSet' */
  field: string
  /** Human-readable domain, e.g. 'language pack', 'icon set' */
  domain: string
  /** Example value for type/empty error messages (defaults to validList[0]) */
  example?: string
  /** Custom message when value === 'all' */
  allMessage?: string
  /** Domain-specific exclusions: name → full rejection message */
  exclusions?: ReadonlyMap<string, string>
}

/**
 * Validate a single string value against a list of valid names.
 * Handles type guard, empty check, valid-list membership, 'all' rejection,
 * and domain-specific exclusions with custom messages.
 */
export function validateSingleValue(value: unknown, opts: SingleValidatorOptions): void {
  const { validList, field, domain, allMessage, exclusions } = opts
  const example = opts.example ?? validList[0]

  if (Array.isArray(value) || typeof value !== 'string') {
    throw new TypeError(
      `nuxt-quasar-vite: ${field} must be a single string, got ${Array.isArray(value) ? 'an array' : `a ${typeof value}`}. `
      + `Pass one ${domain} name (e.g. '${example}').`,
    )
  }
  if (value === '') {
    throw new Error(
      `nuxt-quasar-vite: ${field} is empty; a named ${domain} is required (e.g. '${example}').`,
    )
  }
  if ((validList as readonly string[]).includes(value)) return
  if (value === 'all' && allMessage) {
    throw new Error(`nuxt-quasar-vite: ${field} ${allMessage}`)
  }
  if (exclusions?.has(value)) {
    throw new Error(`nuxt-quasar-vite: ${exclusions.get(value)!}`)
  }

  const suggestion = nearestSuggestion(value, validList)
  throw new Error(
    `nuxt-quasar-vite: unknown Quasar ${domain}: '${value}'${suggestion}. Valid ${domain}s: ${validList.join(', ')}`,
  )
}

/**
 * Options for array validation (iconLibraries, animations, plugins).
 */
export interface ArrayValidatorOptions {
  /** List of valid names */
  validList: readonly string[]
  /** Human-readable domain, e.g. 'icon library', 'animation', 'plugin' */
  domain: string
  /** Plural form of domain (defaults to `${domain}s`) */
  domainPlural?: string
  /** Wrap names in quotes in error messages (default: true) */
  quoteNames?: boolean
  /** Custom message when item === 'all' (replaces entire detail for that item) */
  allMessage?: string
  /** Custom hint per invalid item (replaces levenshtein suggestion) */
  perItemHint?: (name: string) => string | undefined
  /** Custom error suffix (defaults to "Valid <domainPlural>: <list>") */
  errorSuffix?: string
}

/**
 * Validate an array of string values against a list of valid names.
 * Handles per-item 'all' rejection, domain-specific per-item hints,
 * and Levenshtein nearest-neighbor suggestions.
 */
export function validateArrayValues(names: string[], opts: ArrayValidatorOptions): void {
  const { validList, domain, quoteNames = true, allMessage, perItemHint, errorSuffix } = opts

  const invalid = names.filter(name => !(validList as readonly string[]).includes(name))
  if (invalid.length === 0) return

  const q = (name: string) => quoteNames ? `'${name}'` : name

  const details = invalid.map((name) => {
    if (name === 'all' && allMessage) return allMessage
    const custom = perItemHint?.(name)
    if (custom) return `${q(name)} ${custom}`
    const suggestion = nearestSuggestion(name, validList)
    return `${q(name)}${suggestion}`
  })

  const domainPlural = opts.domainPlural ?? `${domain}s`
  const suffix = errorSuffix ?? `Valid ${domainPlural}: ${validList.join(', ')}`
  throw new Error(
    `nuxt-quasar-vite: unknown Quasar ${domain}(s): ${details.join(', ')}. ${suffix}`,
  )
}
