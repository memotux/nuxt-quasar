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
