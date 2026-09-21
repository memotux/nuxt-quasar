import {
  defineNuxtModule,
  addPluginTemplate,
  resolvePath,
  useLogger,
} from '@nuxt/kit'
import type { ViteConfig } from '@nuxt/schema'
import type { QuasarUIConfiguration } from 'quasar'
import type { VALID_PLUGINS, QuasarAnimation, QuasarIconLibrary, QuasarIconSet, QuasarLang } from './internal'
import {
  validatePlugins,
  normalizePlugins,
  normalizeAnimations,
  validateAnimations,
  normalizeIconLibraries,
  validateIconLibraries,
  validateIconSet,
  validateLang,
  warnLegacyIconCss,
  mergeScssOptions,
  mergeSassOptions,
  buildDefineMatrix,
  buildPluginContents,
  buildSassImportCode,
  buildImportPresets,
  buildComponentDir,
  requiredExtrasOptions,
  extrasRequirementMessage,
} from './internal'

interface ModuleOptions {
  sassVariables?: string | boolean
  css?: string[]
  animations?: 'all' | QuasarAnimation[]
  iconLibraries?: QuasarIconLibrary[]
  iconSet?: QuasarIconSet
  lang?: QuasarLang
  plugins: typeof VALID_PLUGINS[number][]
  config?: QuasarUIConfiguration
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
    animations: [],
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
  setup: async (opts, nuxt) => {
    validatePlugins(opts.plugins)
    // defu merges the `plugins` default with the user list by concatenation:
    // dedupe so an explicitly re-declared default (e.g. 'Notify') cannot
    // emit a duplicate import specifier and break the generated plugin.
    // Validation runs first, so invalid-name error semantics are unchanged.
    const plugins = normalizePlugins(opts.plugins)
    const animations = normalizeAnimations(opts.animations)
    validateAnimations(animations)
    const iconLibraries = normalizeIconLibraries(opts.iconLibraries)
    validateIconLibraries(iconLibraries)
    if (opts.iconSet !== undefined) {
      validateIconSet(opts.iconSet)
    }
    if (opts.lang !== undefined) {
      validateLang(opts.lang)
    }
    // Animations, icon libraries and svg-* icon sets all resolve assets
    // from @quasar/extras, so one guard covers them.
    const extrasOptions = requiredExtrasOptions({
      animations,
      iconLibraries,
      iconSet: opts.iconSet,
    })
    if (extrasOptions.length > 0) {
      try {
        await resolvePath('@quasar/extras/package.json')
      }
      catch {
        throw new Error(extrasRequirementMessage(extrasOptions))
      }
    }
    warnLegacyIconCss(opts.css ?? [], useLogger('nuxt-quasar-vite'))
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
        plugins,
        css: opts.css ?? [],
        animations,
        iconLibraries,
        iconSet: opts.iconSet,
        lang: opts.lang,
        config: opts.config,
        quasarVersion: __QUASAR_VERSION__,
      }),
    })
  },
})
