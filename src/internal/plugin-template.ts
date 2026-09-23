import type { QuasarUIConfiguration } from 'quasar'
import { buildAnimationImports } from './animations'
import { buildIconLibraryImports } from './icon-libraries'
import { iconSetImportLine } from './icon-set'
import { langImportLine } from './lang'

/** Indentation of the `config` field inside the generated `includes` object (`setup()` body). */
const CONFIG_FIELD_INDENT = '      '

export interface PluginTemplateOptions {
  plugins: string[]
  css: string[]
  animations?: string[]
  iconLibraries?: string[]
  iconSet?: string
  lang?: string
  config: QuasarUIConfiguration | undefined
  quasarVersion: string
}

/**
 * Generate the virtual plugin template content for `addPluginTemplate`.
 *
 * Produces a Nuxt plugin that installs Quasar with the configured plugins,
 * CSS imports, and config. Handles SSR install branching and client-side
 * SSR hydration takeover via `onSSRHydrated`.
 */
export function buildPluginContents(opts: PluginTemplateOptions): string {
  // JSON.stringify emits its tree from column 0; shift it into the `includes`
  // block so the closing brace aligns with `config:` instead of column 0.
  // The optional chain keeps the `config: undefined` output when unset.
  const config = JSON.stringify(opts.config, null, 2)
    ?.replace(/\n/g, `\n${CONFIG_FIELD_INDENT}`)
  const plugins = opts.plugins.join(',')
  const animations = buildAnimationImports(opts.animations ?? []).join('\n')
  const iconLibraries = buildIconLibraryImports(opts.iconLibraries ?? []).join('\n')
  const css = opts.css?.map(s => `import '${s}'`).join('\n') || ''
  // module.ts validates iconSet and lang before wiring them here;
  // undefined means "not configured", not "needs re-validation".
  const iconSetImport = opts.iconSet ? iconSetImportLine(opts.iconSet) : ''
  const iconSetEntry = iconSetImport ? '\n      iconSet,' : ''
  const langImport = opts.lang ? langImportLine(opts.lang) : ''
  const langEntry = langImport ? '\n      lang,' : ''
  // Import order is deterministic: iconSet -> lang -> animations -> icon libraries -> free-form css.
  // Empty groups drop out so no blank import lines are emitted.
  const importGroups = [iconSetImport, langImport, animations, iconLibraries, css].filter(Boolean).join('\n')

  return `import type { Plugin } from 'vue'
import { defineNuxtPlugin, onNuxtReady } from '#app'
import installQ from 'quasar/src/install-quasar.js'
import { ${plugins} } from 'quasar/src/plugins.js'
import * as directives from 'quasar/src/directives.js'

${importGroups}

export default defineNuxtPlugin({
  name: 'nuxt:quasar-install',
  setup(nuxtApp) {
    const includes = {
      directives,
      plugins: { ${plugins} },
      config: ${config},${iconSetEntry}${langEntry}
    }

    const quasarPlugin: Plugin & { version: string } = {
      version: ${opts.quasarVersion},
      install(app, opts) {
        if(import.meta.server) {
          installQ(app, {...opts, ...includes}, nuxtApp.ssrContext!.event.node)
        } else {
          installQ(app, {...opts, ...includes})
        }
      },
    }

    nuxtApp.vueApp.use(quasarPlugin)

    if (import.meta.client) {
      onNuxtReady(() => {
        // Quasar SSR hydration takeover: with __QUASAR_SSR_CLIENT__ enabled,
        // Screen/Platform/Meta/Body defer client init to $q.onSSRHydrated(),
        // which the SSR application must call once hydration completes.
        const $q = nuxtApp.vueApp.config.globalProperties.$q as { onSSRHydrated?: () => void } | undefined
        $q?.onSSRHydrated?.()
      })
    }
  }
})
`
}
