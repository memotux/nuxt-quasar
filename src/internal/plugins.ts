import { validateArrayValues } from './validation'

export const VALID_PLUGINS = [
  'AddressbarColor', 'AppFullscreen', 'AppVisibility',
  'BottomSheet', 'Dialog', 'LoadingBar', 'Loading',
  'Notify', 'LocalStorage', 'SessionStorage',
] as const

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
