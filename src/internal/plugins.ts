export const VALID_PLUGINS = [
  'AddressbarColor', 'AppFullscreen', 'AppVisibility',
  'BottomSheet', 'Dialog', 'LoadingBar', 'Loading',
  'Notify', 'LocalStorage', 'SessionStorage',
] as const

export function validatePlugins(plugins: string[]): void {
  const invalid = plugins.filter(p => !(VALID_PLUGINS as readonly string[]).includes(p))
  if (invalid.length > 0) {
    throw new Error(
      `nuxt-quasar-vite: unknown Quasar plugin(s): ${invalid.join(', ')}. Valid plugins: ${VALID_PLUGINS.join(', ')}`,
    )
  }
}
