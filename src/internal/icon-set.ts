import { levenshteinDistance } from './levenshtein'

/**
 * The publicly licensed icon-set mappings shipped by `quasar@2.27.0` under
 * `quasar/icon-set/` (20 webfont + 21 svg).
 *
 * Deliberately excludes the Font Awesome Pro variants
 * (`fontawesome-v5-pro`, `fontawesome-v6-pro`, `fontawesome-v7-pro`):
 * `@quasar/extras` does not ship their paid fonts, so accepting them would
 * pass validation while silently producing broken icons. Use the free-form
 * `css` option as the escape hatch for manual Pro setup.
 */
export const VALID_ICON_SETS = [
  'bootstrap-icons',
  'eva-icons',
  'fontawesome-v5',
  'fontawesome-v6',
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
  'mdi-v3',
  'mdi-v4',
  'mdi-v5',
  'mdi-v6',
  'mdi-v7',
  'svg-bootstrap-icons',
  'svg-eva-icons',
  'svg-fontawesome-v5',
  'svg-fontawesome-v6',
  'svg-fontawesome-v7',
  'svg-ionicons-v4',
  'svg-ionicons-v5',
  'svg-ionicons-v6',
  'svg-ionicons-v7',
  'svg-ionicons-v8',
  'svg-line-awesome',
  'svg-material-icons',
  'svg-material-icons-outlined',
  'svg-material-icons-round',
  'svg-material-icons-sharp',
  'svg-material-symbols-outlined',
  'svg-material-symbols-rounded',
  'svg-material-symbols-sharp',
  'svg-mdi-v6',
  'svg-mdi-v7',
  'svg-themify',
  'themify',
] as const

export type QuasarIconSet = typeof VALID_ICON_SETS[number]

/** Font Awesome Pro variants: exist in Quasar, excluded from the typed list. */
const PRO_ICON_SETS: ReadonlySet<string> = new Set([
  'fontawesome-v5-pro',
  'fontawesome-v6-pro',
  'fontawesome-v7-pro',
])

/**
 * Whether the icon set is an `svg-*` variant. SVG mappings import their icons
 * from `@quasar/extras/<name>`, so they require that package; webfont mappings
 * are pure JS lookups and leave the font CSS to the user.
 */
export function isSvgIconSet(name: string): boolean {
  return name.startsWith('svg-') && (VALID_ICON_SETS as readonly string[]).includes(name)
}

/**
 * Validate a single icon-set name. Quasar supports exactly one active IconSet,
 * so arrays, objects, non-strings, the empty string and the `'all'` shorthand
 * are all rejected with explicit errors. Unknown names get a did-you-mean hint.
 */
export function validateIconSet(name: string): void {
  if (Array.isArray(name) || typeof name !== 'string') {
    throw new TypeError(
      `nuxt-quasar-vite: iconSet must be a single string, got ${Array.isArray(name) ? 'an array' : `a ${typeof name}`}. `
      + 'Pass one icon set name (e.g. \'material-icons\').',
    )
  }
  if (name === '') {
    throw new Error(
      'nuxt-quasar-vite: iconSet is empty; a named mapping is required (e.g. \'material-icons\').',
    )
  }
  if ((VALID_ICON_SETS as readonly string[]).includes(name)) return
  if (name === 'all') {
    throw new Error(
      'nuxt-quasar-vite: iconSet \'all\' is not a valid icon set; only a single named mapping '
      + 'is accepted (e.g. \'material-icons\').',
    )
  }
  if (PRO_ICON_SETS.has(name)) {
    throw new Error(
      `nuxt-quasar-vite: unknown Quasar icon set: '${name}'. Font Awesome Pro variants exist in Quasar `
      + 'but require manual setup via the css option. '
      + `Valid icon sets: ${VALID_ICON_SETS.join(', ')}`,
    )
  }

  const nearest = VALID_ICON_SETS.reduce((best, candidate) => {
    return levenshteinDistance(name, candidate) < levenshteinDistance(name, best) ? candidate : best
  })
  const suggestion = levenshteinDistance(name, nearest) <= 3
    ? ` (did you mean '${nearest}'?)`
    : ''
  throw new Error(
    `nuxt-quasar-vite: unknown Quasar icon set: '${name}'${suggestion}. `
    + `Valid icon sets: ${VALID_ICON_SETS.join(', ')}`,
  )
}

/**
 * Build the plugin-template import line for an icon set:
 * `import iconSet from 'quasar/icon-set/<name>.js'`.
 */
export function iconSetImportLine(name: string): string {
  validateIconSet(name)
  return `import iconSet from 'quasar/icon-set/${name}.js'`
}
