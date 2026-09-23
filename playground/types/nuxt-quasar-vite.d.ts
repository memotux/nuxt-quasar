/**
 * Ambient shim that lets the playground program resolve the package specifier
 * Nuxt emits into `.nuxt/types/modules.d.ts` for this module's `configKey`.
 *
 * Nuxt always uses the module's `meta.name` (`nuxt-quasar-vite`) as the specifier,
 * but the playground consumes the module through `../src/module` and is not a pnpm
 * workspace package, so the name resolves nowhere. Without this, the generated
 * `quasar` key collapses to `Record<string, any>` (hidden by `skipLibCheck`) and
 * the playground config is not type-checked.
 *
 * Pointing at `src/module` keeps the playground on the source of truth; the
 * published `dist/module.d.mts` is what real consumers resolve.
 */
declare module 'nuxt-quasar-vite' {
  const nuxtQuasarVite: typeof import('../../src/module').default
  export default nuxtQuasarVite
}
