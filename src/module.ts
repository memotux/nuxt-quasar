import type { Plugin } from 'vite'
import {
  defineNuxtModule,
  addPluginTemplate
} from '@nuxt/kit'
import { quasar } from '@quasar/vite-plugin'
import { genObjectFromRawEntries } from 'knitwork'

interface ModuleOptions {
  sassVariables?: string | boolean
  css?: string[]
  plugins?: ['Notify' | 'Dialog']
  config?: {
    dark: boolean
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    // Usually  npm package name of your module
    name: 'quasar-nuxt',
    // The key in `nuxt.config` that holds your module options
    configKey: 'quasar',
    // Compatibility constraints
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '^3.0.0'
    }
  },
  // Default configuration options for your module
  defaults: {
    sassVariables: true,
    css: ['quasar/src/css/index.sass'],
    plugins: ['Notify'],
    config: {
      dark: true
    }
  },
  hooks: {
    'autoImports:sources': (presets) => {
      presets.push({
        from: 'quasar/src/composables',
        imports: [
          'useQuasar',
          'useDialogPluginComponent',
          'useFormChild'
        ]
      }, {
        from: 'quasar/src/utils',
        imports: [
          // ['clone', 'qClone'],
          // ['colors', 'qColors'],
          // ['copy-to-clipboard', 'qCopyToClipboard'],
          ['date', 'qDate'],
          // ['debounce', 'qDebounce'],
          // ['dom', 'qDom'],
          // ['event', 'qEvent'],
          // ['export-file', 'qExportFile'],
          // ['extend', 'qExtend'],
          // ['format', 'qFormat'],
          // ['morph', 'qMorph'],
          // ['open-url', 'qOpenUrl'],
          // ['patterns', 'qPatterns'],
          // ['prevent-scroll', 'qPreventScroll'],
          // ['scroll', 'qScroll'],
          // ['throttle', 'qThrottle'],
          ['uid', 'qUid']
        ]
      })
    },
    'components:dirs': (dirs) => {
      dirs.push({
        path: '@/node_modules/quasar/src/components',
        transpile: true,
        watch: false,
        pattern: '**/Q**.js',
        extendComponent: (component) => {
          return {
            ...component,
            export: 'default',
            pascalName: component.pascalName.slice(
              component.pascalName.indexOf('Q')
            ),
            kebabName: component.kebabName.slice(
              component.kebabName.indexOf('q')
            )
          }
        }
      })
    }
  },
  setup: (opts, nuxt) => {
    nuxt.options.css.push(...opts.css)

    nuxt.hook('vite:extendConfig', (config, { isServer }) => {
      const vitePlugins = quasar({
        runMode: isServer ? 'ssr-server' : 'web-client',
        sassVariables: opts.sassVariables
      }) as unknown as Plugin[]

      config.plugins.push(vitePlugins)

      return config
    })

    addPluginTemplate({
      filename: 'plugins/quasarVueUse.ts',
      mode: 'client',
      write: true,
      getContents: () => {
        const config = genObjectFromRawEntries(Object.entries(opts.config), '\t\t')
        const plugins = opts.plugins.join(',')

        return `
import Quasar from "quasar/src/vue-plugin"
import { ${plugins} } from "quasar/src/plugins"

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Quasar, {
    plugins: { ${plugins} },
    config: ${config},
  })
})
`
      }
    })
  }
})
