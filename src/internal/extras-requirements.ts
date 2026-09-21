import { isSvgIconSet } from './icon-set'

/**
 * Names of the module options that require the consumer to install
 * `@quasar/extras`, in the stable order `animations`, `iconLibraries`,
 * `iconSet`.
 *
 * The non-obvious part is `iconSet`: only the `svg-*` mappings import their
 * icons from `@quasar/extras`. The webfont mappings are pure JS lookups that
 * leave the font CSS to the user, so they need no extra package. Keeping that
 * distinction (via {@link isSvgIconSet}) in one pure unit makes it testable
 * without standing up the whole Nuxt module.
 *
 * The returned order is load-bearing: the module joins the names with
 * `' or '` in its error message.
 *
 * Assumes already-validated input — `src/module.ts` validates the options
 * before calling this, so no validation happens here.
 */
export function requiredExtrasOptions(input: {
  animations: readonly string[]
  iconLibraries: readonly string[]
  iconSet?: string
}): string[] {
  return [
    input.animations.length > 0 ? 'animations' : '',
    input.iconLibraries.length > 0 ? 'iconLibraries' : '',
    input.iconSet !== undefined && isSvgIconSet(input.iconSet) ? 'iconSet' : '',
  ].filter(Boolean)
}

/**
 * Build the user-facing error shown when a configured option requires
 * `@quasar/extras` but the package is not installed. The names are joined with
 * `' or '` in the order produced by {@link requiredExtrasOptions}, so the two
 * units are kept side by side and the exact wording stays testable.
 */
export function extrasRequirementMessage(options: readonly string[]): string {
  return `nuxt-quasar-vite: using ${options.join(' or ')} requires the @quasar/extras package. `
    + 'Install it with: pnpm add -D @quasar/extras'
}
