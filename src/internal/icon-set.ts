import { GENERATED_ICON_SETS_SHIPPED } from './generated-quasar-lists'
import { validateSingleValue } from './validation'

/** Font Awesome Pro variants: exist in Quasar's shipped files, excluded from the typed list. */
const PRO_ICON_SET_NAMES: ReadonlySet<string> = new Set([
  'fontawesome-v5-pro',
  'fontawesome-v6-pro',
  'fontawesome-v7-pro',
])

/**
 * Policy exclusions applied on top of the generated upstream inventory:
 * the Font Awesome Pro variants exist in Quasar (and in the generated
 * `GENERATED_ICON_SETS_SHIPPED`) but `@quasar/extras` does not ship their
 * paid fonts, so accepting them would pass validation while silently
 * producing broken icons. Use the free-form `css` option as the escape
 * hatch for manual Pro setup.
 */
export const VALID_ICON_SETS = GENERATED_ICON_SETS_SHIPPED
  .filter(name => !PRO_ICON_SET_NAMES.has(name))

export type QuasarIconSet = typeof VALID_ICON_SETS[number]

/**
 * Build the full rejection message for a Font Awesome Pro icon set.
 */
function proIconSetMessage(name: string): string {
  return `unknown Quasar icon set: '${name}'. Font Awesome Pro variants exist in Quasar but require manual setup via the css option. Valid icon sets: ${VALID_ICON_SETS.join(', ')}`
}

/** Pre-built exclusion map for Pro icon sets. */
const ICON_SET_EXCLUSIONS: ReadonlyMap<string, string> = new Map(
  [...PRO_ICON_SET_NAMES].map(name => [name, proIconSetMessage(name)]),
)

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
export function validateIconSet(name: unknown): void {
  validateSingleValue(name, {
    validList: VALID_ICON_SETS,
    field: 'iconSet',
    domain: 'icon set',
    example: 'material-icons',
    allMessage: '\'all\' is not a valid icon set; only a single named mapping is accepted (e.g. \'material-icons\').',
    exclusions: ICON_SET_EXCLUSIONS,
  })
}

/**
 * Build the plugin-template import line for an icon set:
 * `import iconSet from 'quasar/icon-set/<name>.js'`.
 */
export function iconSetImportLine(name: string): string {
  validateIconSet(name)
  return `import iconSet from 'quasar/icon-set/${name}.js'`
}
