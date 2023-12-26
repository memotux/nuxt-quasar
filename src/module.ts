import {
  defineNuxtModule,
  addPluginTemplate,
  resolvePath
} from '@nuxt/kit'

interface ModuleOptions {
  sassVariables?: string | boolean
  css?: string[]
  plugins: Array<'AddressbarColor' | 'AppFullscreen' | 'AppVisibility' | 'BottomSheet' | 'Dialog' | 'LoadingBar' | 'Loading' | 'Notify' | 'LocalStorage' | 'SessionStorage'>
  config?: {
    dark: boolean
  }
}

// eslint-disable-next-line quotes
const __QUASAR_VERSION__ = `'2.14.2'`

export default defineNuxtModule<ModuleOptions>({
  meta: {
    // Usually  npm package name of your module
    name: 'nuxt-quasar-vite',
    // The key in `nuxt.config` that holds your module options
    configKey: 'quasar',
    // Compatibility constraints
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '^3.0.0-rc.2'
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
    'imports:sources': (presets) => {
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
          ['clone', 'qclone'],
          ['colors', 'qcolors'],
          ['copyToClipboard', 'qcopyToClipboard'],
          ['createMetaMixin', 'qcreateMetaMixin'],
          ['createUploaderComponent', 'qcreateUploaderComponent'],
          ['date', 'qdate'],
          ['debounce', 'qdebounce'],
          ['dom', 'qdom'],
          ['event', 'qevent'],
          ['exportFile', 'qexportFile'],
          ['extend', 'qextend'],
          ['format', 'qformat'],
          ['frameDebounce', 'qframeDebounce'],
          ['getCssVar', 'qgetCssVar'],
          ['noop', 'qnoop'],
          ['morph', 'qmorph'],
          ['openURL', 'qopenURL'],
          ['patterns', 'qpatterns'],
          ['scroll', 'qscroll'],
          ['setCssVar', 'qsetCssVar'],
          ['throttle', 'qthrottle'],
          ['uid', 'quid']
        ]
      })
    },
    'components:dirs': async (dirs) => {
      const source = (await resolvePath('quasar/src/components')).replace('.js', '')

      dirs.push({
        path: source,
        transpile: true,
        watch: false,
        pattern: '*/Q*.js',
        pathPrefix: false
      })
    },
    'prepare:types': ({ references }) => {
      references.unshift({ types: 'quasar' })
    }
  },
  setup: (opts, nuxt) => {
    if (!nuxt.options.build.transpile.includes('quasar')) {
      nuxt.options.build.transpile.unshift('quasar')
    }

    nuxt.hook('vite:extendConfig', async (config, { isServer, isClient }) => {
      config.define = config.define || {}
      config.plugins = config.plugins || []
      const define = {
        __QUASAR_VERSION__: `${__QUASAR_VERSION__}`,
        __QUASAR_SSR__: isServer,
        __QUASAR_SSR_SERVER__: isServer,
        __QUASAR_SSR_CLIENT__: isServer && isClient,
        __QUASAR_SSR_PWA__: false
      }

      Object.assign(config.define, define)

      if (opts.sassVariables) {
        const sassImportCode = ["@import 'quasar/src/css/variables.sass'", '']

        if (typeof opts.sassVariables === 'string') {
          sassImportCode.unshift(`@import '${opts.sassVariables}'`)
        }
        config.css = config.css || {}
        config.css.preprocessorOptions = config.css.preprocessorOptions || {}

        config.css.preprocessorOptions.scss = {
          additionalData: sassImportCode.join(';\n')
        }
        config.css.preprocessorOptions.sass = {
          additionalData: sassImportCode.join('\n')
        }
      }
    })

    addPluginTemplate({
      filename: 'plugins/quasarVueUse.ts',
      mode: 'all',
      write: true,
      getContents: () => {
        const config = JSON.stringify(opts.config, null, 2)
        const plugins = opts.plugins.join(',')
        const css = opts.css?.map((s) => `import '${s}'`).join('\n') || ''

        return `import installQ from 'quasar/src/install-quasar'
import { ${plugins} } from 'quasar/src/plugins'
import lang from 'quasar/src/lang'
import iconSet from 'quasar/src/icon-set'
import * as directives from 'quasar/src/directives'

${css}

export default defineNuxtPlugin((nuxtApp) => {
  const includes = {
    directives,
    plugins: { ${plugins} },
    config: ${config},
  }
  
  nuxtApp.vueApp.use({
    version: ${__QUASAR_VERSION__},
    install(app, opts) {
      if(process.server) {
        installQ(app, {...opts, ...includes}, nuxtApp.ssrContext.event)
      } else {
        installQ(app, {...opts, ...includes})
      }
    },
    lang,
    iconSet
  })
})
`
      }
    })
  }
})
