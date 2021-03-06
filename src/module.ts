import { dirname } from 'pathe'
import {
  defineNuxtModule,
  addPluginTemplate,
  resolvePath
} from '@nuxt/kit'
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

// eslint-disable-next-line quotes
const __QUASAR_VERSION__ = `'2.7.3'`

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
      const source = dirname(await resolvePath('quasar/src/components')) + '/components'

      dirs.push({
        path: source,
        transpile: true,
        watch: false,
        pattern: '*/Q*.js',
        pathPrefix: false
      })
    },
    'build:before': (_, options) => {
      if (!options.transpile.includes('quasar')) { options.transpile.unshift('quasar') }
    },
    'prepare:types': ({ references }) => {
      references.unshift({ types: 'quasar' })
    }
  },
  setup: (opts, nuxt) => {
    nuxt.options.css.push(...opts.css)

    nuxt.hook('vite:extendConfig', async (config, { isServer, isClient }) => {
      const define = {
        __QUASAR_VERSION__: `${__QUASAR_VERSION__}`,
        __QUASAR_SSR__: isServer,
        __QUASAR_SSR_SERVER__: isServer,
        __QUASAR_SSR_CLIENT__: isServer && isClient,
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
  const includes = {
    directives,
    plugins: { ${plugins} },
    config: ${config},
  }
  
  nuxtApp.vueApp.use({
    version: ${__QUASAR_VERSION__},
    install(app, opts) {
      if(process.server) {
        installQ(app, {...opts, ...includes}, nuxtApp.ssrContext)
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
