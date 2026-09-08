/**
 * Build the Vite `define` map for Quasar SSR feature flags.
 *
 * SSR defines are build-level (nuxt.options.ssr), not env-level.
 * Quasar expects the same __QUASAR_SSR__ on client and server bundles,
 * and vite:extendConfig env flags are mutually exclusive per call.
 */
export function buildDefineMatrix(
  ssrEnabled: boolean,
  isServer: boolean,
  isClient: boolean,
  quasarVersion: string,
): Record<string, unknown> {
  return {
    __QUASAR_VERSION__: quasarVersion,
    __QUASAR_SSR__: ssrEnabled,
    __QUASAR_SSR_SERVER__: isServer && ssrEnabled,
    __QUASAR_SSR_CLIENT__: isClient && ssrEnabled,
    __QUASAR_SSR_PWA__: false,
  }
}
