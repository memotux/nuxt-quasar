export interface PluginTemplateOptions {
  plugins: string[]
  css: string[]
  config: Record<string, unknown> | undefined
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
  const config = JSON.stringify(opts.config, null, 2)
  const plugins = opts.plugins.join(',')
  const css = opts.css?.map(s => `import '${s}'`).join('\n') || ''

  return `import installQ from 'quasar/src/install-quasar.js'
import { ${plugins} } from 'quasar/src/plugins.js'
import lang from 'quasar/src/plugins/lang/Lang.js'
import iconSet from 'quasar/src/plugins/icon-set/IconSet.js'
import * as directives from 'quasar/src/directives.js'

${css}

export default defineNuxtPlugin({
  name: 'nuxt:quasar-install',
  setup(nuxtApp) {
    const includes = {
      directives,
      plugins: { ${plugins} },
      config: ${config},
    }

    nuxtApp.vueApp.use({
      version: ${opts.quasarVersion},
      install(app, opts) {
        if(import.meta.server) {
          installQ(app, {...opts, ...includes}, nuxtApp.ssrContext.event.node)
        } else {
          installQ(app, {...opts, ...includes})
        }
      },
      lang,
      iconSet
    })

    if (import.meta.client) {
      onNuxtReady(() => {
        // Quasar SSR hydration takeover: with __QUASAR_SSR_CLIENT__ enabled,
        // Screen/Platform/Meta/Body defer client init to $q.onSSRHydrated(),
        // which the SSR application must call once hydration completes.
        nuxtApp.vueApp.config.globalProperties.$q?.onSSRHydrated?.()
      })
    }
  }
})
`
}
