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
  'AddressbarColor', 'AppFullscreen', 'AppNetwork', 'AppVisibility',
  'AppWakeLock', 'BottomSheet', 'Dialog', 'LoadingBar', 'Loading',
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

/**
 * Quasar 2.34+ opt-in plugins (QAS-3). Curated into `VALID_PLUGINS` above so
 * the public option type accepts them, but only usable when the consumer's
 * installed Quasar actually exports them — see `validatePlugins`.
 */
const QUASAR_234_PLUGINS = ['AppNetwork', 'AppWakeLock'] as const

export interface PluginSupport {
  /** Plugin names the consumer's resolved `quasar/src/plugins.js` exports. */
  exportedPlugins: readonly string[]
  /** Installed consumer Quasar version (e.g. `'2.27.0'`), for error context. */
  quasarVersion: string
  /** Human-readable origin of the export surface, for error context. */
  sourceLabel: string
}

export function validatePlugins(plugins: string[], support?: PluginSupport): void {
  validateArrayValues(plugins, {
    validList: VALID_PLUGINS,
    domain: 'plugin',
    quoteNames: false,
  })
  if (support === undefined) return
  const exported = new Set(support.exportedPlugins)
  const unsupported = plugins.filter(
    name => (QUASAR_234_PLUGINS as readonly string[]).includes(name) && !exported.has(name),
  )
  if (unsupported.length === 0) return
  const details = unsupported.map(
    name =>
      `'${name}' is not exported by the installed Quasar `
      + `(${support.quasarVersion}, ${support.sourceLabel}); `
      + 'it requires Quasar 2.34 or newer. Upgrade the installed Quasar '
      + `or remove '${name}' from the 'plugins' option`,
  )
  throw new Error(`nuxt-quasar-vite: unsupported Quasar plugin(s): ${details.join('; ')}`)
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
