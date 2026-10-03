import { GENERATED_QUASAR_PLUGINS } from './generated-quasar-lists'
import { validateArrayValues } from './validation'

/**
 * Curated opt-in plugin subset of the generated upstream plugin inventory.
 * Deliberately stays a strict subset: generation must not expand the public
 * auto-install set to every Quasar plugin (e.g. `Cookies`, `Dark`,
 * `Meta`, `Platform`, `Screen`). Every curated name must still exist
 * upstream — imports from `quasar/src/plugins.js` would otherwise fail —
 * so the reconciliation check below fails loudly on upstream removals.
 */
export const VALID_PLUGINS = [
  'AddressbarColor', 'AppFullscreen', 'AppVisibility',
  'BottomSheet', 'Dialog', 'LoadingBar', 'Loading',
  'Notify', 'LocalStorage', 'SessionStorage',
] as const

for (const name of VALID_PLUGINS) {
  if (!(GENERATED_QUASAR_PLUGINS as readonly string[]).includes(name)) {
    throw new Error(
      `nuxt-quasar-vite: curated plugin '${name}' is no longer shipped by the installed Quasar; `
      + `regenerate the snapshot and update the curated list`,
    )
  }
}

export function validatePlugins(plugins: string[]): void {
  validateArrayValues(plugins, {
    validList: VALID_PLUGINS,
    domain: 'plugin',
    quoteNames: false,
  })
}

/**
 * Deduplicate the (defu-merged) plugins list. Nuxt merges module defaults
 * with user options by array concatenation, so a user who explicitly
 * includes the default 'Notify' would otherwise emit a duplicate import
 * specifier (`Notify,Notify,Dialog`) — a hard parse error in the generated
 * plugin. First occurrence wins; order is preserved.
 */
export function normalizePlugins(plugins?: string[]): string[] {
  if (plugins === undefined) return []
  return [...new Set(plugins.filter(Boolean))]
}
