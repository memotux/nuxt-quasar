import { VALID_PLUGINS } from './plugins'

/**
 * Ambient type declarations for the Quasar internals the generated plugin
 * imports directly.
 *
 * Quasar ships types only for its public entry (`quasar`), so
 * `quasar/src/install-quasar.js`, `quasar/src/plugins.js`,
 * `quasar/src/directives.js` and `quasar/src/css/index.sass` would otherwise
 * fail `vue-tsc` (TS7016/TS2882) inside every generated `.nuxt/quasar/plugin.ts`
 * — including the module's own root `.nuxt`, the playground and every consumer.
 *
 * Emitted through `addTypeTemplate`, so Nuxt writes it to `.nuxt/types/` and
 * references it from the generated `nuxt.d.ts`. The plugin names are derived
 * from `VALID_PLUGINS`, so the declaration cannot drift from the plugins the
 * module is allowed to import.
 */
export const QUASAR_INTERNALS_DTS = `declare module 'quasar/src/install-quasar.js' {
  const installQuasar: (app: unknown, opts: unknown, ssrContext?: unknown) => void
  export default installQuasar
}

declare module 'quasar/src/plugins.js' {
${VALID_PLUGINS.map(name => `  export const ${name}: unknown`).join('\n')}
}

declare module 'quasar/src/directives.js' {
  const directives: Record<string, unknown>
  export = directives
}

declare module 'quasar/src/css/index.sass'
`
