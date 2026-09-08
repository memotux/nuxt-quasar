import {
  defineNuxtModule,
  addPluginTemplate,
  resolvePath,
} from '@nuxt/kit'
import type { ViteConfig } from '@nuxt/schema'
import type { VALID_PLUGINS } from './internal'
import {
  validatePlugins,
  mergeScssOptions,
  mergeSassOptions,
  buildDefineMatrix,
  buildPluginContents,
  buildSassImportCode,
  buildImportPresets,
  buildComponentDir,
} from './internal'

interface ModuleOptions {
  sassVariables?: string | boolean
  css?: string[]
  plugins: typeof VALID_PLUGINS[number][]
  config?: {
    dark: boolean
  }
}

const quasarPkgInfo = (await import('quasar/package.json', { with: { type: 'json' } })).default
const __QUASAR_VERSION__ = `'${quasarPkgInfo.version}'`
const quasarSrc = await resolvePath('quasar').then(path => path.replace(/dist.*$/g, 'src/'))

export default defineNuxtModule<ModuleOptions>({
  meta: {
    // Usually  npm package name of your module
    name: 'nuxt-quasar-vite',
    // The key in `nuxt.config` that holds your module options
    configKey: 'quasar',
    // Compatibility constraints
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '>=3.0.0-rc.2',
    },
  },
  // Default configuration options for your module
  defaults: {
    sassVariables: true,
    css: ['quasar/src/css/index.sass'],
    plugins: ['Notify'],
    config: {
      dark: true,
    },
  },
  hooks: {
    'imports:sources': (presets) => {
      presets.push(...buildImportPresets(quasarSrc))
    },
    'components:dirs': async (dirs) => {
      dirs.push(buildComponentDir(quasarSrc))
    },
    'prepare:types': ({ references }) => {
      references.unshift({ types: 'quasar' })
    },
  },
  setup: (opts, nuxt) => {
    validatePlugins(opts.plugins)
    if (!nuxt.options.build.transpile.includes('quasar')) {
      nuxt.options.build.transpile.unshift('quasar')
    }
    /**
     * Deprecated in Nuxt 5+.
     * In Nuxt 5, this operates on a shared configuration
     * rather than separate client/server configs.
     * https://nuxt.com/docs/4.x/api/advanced/hooks
     */
    nuxt.hook('vite:extendConfig', async (conf, { isServer, isClient }) => {
      const config = conf as ViteConfig

      config.define = config.define || {}
      config.plugins = config.plugins || []
      // SSR defines are build-level (nuxt.options.ssr), not env-level:
      // Quasar expects the same __QUASAR_SSR__ on client and server bundles,
      // and vite:extendConfig env flags are mutually exclusive per call.
      const ssrEnabled = nuxt.options.ssr === true
      const define = buildDefineMatrix(ssrEnabled, isServer, isClient, __QUASAR_VERSION__)

      Object.assign(config.define, define)

      if (opts.sassVariables) {
        const sassImportCode = buildSassImportCode(opts.sassVariables)
        config.css ??= {}
        config.css.preprocessorOptions ??= {}

        const userScssOpts = config.css.preprocessorOptions.scss as Record<string, unknown> | undefined
        const userSassOpts = config.css.preprocessorOptions.sass as Record<string, unknown> | undefined

        config.css.preprocessorOptions.scss = mergeScssOptions(
          {
            additionalData: sassImportCode.join(';\n'),
            silenceDeprecations: ['import'],
          },
          userScssOpts,
        )
        config.css.preprocessorOptions.sass = mergeSassOptions(
          {
            additionalData: sassImportCode.join('\n'),
            silenceDeprecations: ['import'],
          },
          userSassOpts,
        )
      }
    })

    addPluginTemplate({
      filename: 'quasar/plugin.ts',
      mode: 'all',
      write: true,
      getContents: () => buildPluginContents({
        plugins: opts.plugins,
        css: opts.css ?? [],
        config: opts.config,
        quasarVersion: __QUASAR_VERSION__,
      }),
    })
  },
})
