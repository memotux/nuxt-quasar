import {
  defineNuxtModule,
  addPluginTemplate,
  resolvePath
} from '@nuxt/kit'
import { version as qVersion } from 'quasar/package.json'
import { genObjectFromRawEntries } from 'knitwork'
import { getScssTransformPlugin } from './scssTransform'

interface ModuleOptions {
  sassVariables?: string | boolean
  css?: string[]
  plugins?: ['AddressbarColor' | 'AppFullscreen' | 'AppVisibility' | 'BottomSheet' | 'Dialog' | 'LoadingBar' | 'Loading' | 'Notify' | 'LocalStorage' | 'SessionStorage']
  config?: {
    dark: boolean
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    // Usually  npm package name of your module
    name: 'nuxt-quasar-vite',
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
          ['date', 'qdate'],
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
          ['uid', 'quid']
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

    nuxt.hook('vite:extendConfig', async (config, { isServer }) => {
      const define = {
        __QUASAR_VERSION__: `'${qVersion}'`,
        __QUASAR_SSR__: isServer,
        __QUASAR_SSR_SERVER__: isServer,
        __QUASAR_SSR_CLIENT__: isServer,
        __QUASAR_SSR_PWA__: false
      }

      Object.assign(config.define, define)

      if (opts.sassVariables) {
        const scssPath = typeof opts.sassVariables === 'string' ? await resolvePath(opts.sassVariables) : true
        const quasarScssTransform = getScssTransformPlugin(scssPath)
        config.plugins.push(quasarScssTransform)
      }

      return config
    })

    addPluginTemplate({
      filename: 'plugins/quasarVueUse.ts',
      mode: 'all',
      write: true,
      getContents: () => {
        const config = genObjectFromRawEntries(Object.entries(opts.config), '\t\t')
        const plugins = opts.plugins.join(',')

        return `import installQ from 'quasar/src/install-quasar'
import { ${plugins} } from 'quasar/src/plugins'
import lang from 'quasar/src/lang'
import iconSet from 'quasar/src/icon-set'
import * as directives from 'quasar/src/directives'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use({
    version: '${qVersion}',
    install(app,opts) {
      if(process.server) {
        installQ(app, {...opts}, nuxtApp.ssrContext)
      } else {
        installQ(app, {...opts})
      }
    },
    lang,
    iconSet
  }, {
    directives,
    plugins: { ${plugins} },
    config: ${config},
  })
})
`
      }
    })
  }
})
