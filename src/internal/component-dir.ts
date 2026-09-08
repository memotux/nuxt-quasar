export interface ComponentDirEntry {
  path: string
  transpile: boolean
  watch: boolean
  pattern: string
  ignore: string[]
  pathPrefix: boolean
}

/**
 * Build the components:dirs entry that registers Quasar components
 * for auto-import by Nuxt.
 */
export function buildComponentDir(quasarSrc: string): ComponentDirEntry {
  return {
    path: quasarSrc + 'components',
    transpile: true,
    watch: false,
    pattern: '**/Q*.js',
    ignore: ['**.test.js', '*/__tests__/*'],
    pathPrefix: false,
  }
}
