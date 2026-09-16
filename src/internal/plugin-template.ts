import type { QuasarUIConfiguration } from 'quasar'
import { buildIconLibraryImports } from './icon-libraries'
import { VALID_ICON_SETS, iconSetImportLine } from './icon-set'
import { VALID_LANG, langImportLine } from './lang'

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
  const config = JSON.stringify(opts.config, null, 2)
  const plugins = opts.plugins.join(',')
  const animations = opts.animations?.map(s => `import '@quasar/extras/animate/${s}.css'`).join('\n') || ''
  const iconLibraries = buildIconLibraryImports(opts.iconLibraries ?? []).join('\n')
  const css = opts.css?.map(s => `import '${s}'`).join('\n') || ''
  // The module validates iconSet before wiring it here; an unknown or empty
  // name is treated as absent so the template stays a total renderer.
  const iconSetImport = opts.iconSet && (VALID_ICON_SETS as readonly string[]).includes(opts.iconSet)
    ? iconSetImportLine(opts.iconSet)
    : ''
  const iconSetEntry = iconSetImport ? '\n      iconSet,' : ''
  // The module validates lang before wiring it here; an unknown or empty
  // name is treated as absent so the template stays a total renderer.
  const langImport = opts.lang && (VALID_LANG as readonly string[]).includes(opts.lang)
    ? langImportLine(opts.lang)
    : ''
  const langEntry = langImport ? '\n      lang,' : ''
  // Import order is deterministic: iconSet -> lang -> animations -> icon libraries -> free-form css.
  // Empty groups drop out so no blank import lines are emitted.
  const importGroups = [iconSetImport, langImport, animations, iconLibraries, css].filter(Boolean).join('\n')

  return `import installQ from 'quasar/src/install-quasar.js'
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

    nuxtApp.vueApp.use({
      version: ${opts.quasarVersion},
      install(app, opts) {
        if(import.meta.server) {
          installQ(app, {...opts, ...includes}, nuxtApp.ssrContext.event.node)
        } else {
          installQ(app, {...opts, ...includes})
        }
      },
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
