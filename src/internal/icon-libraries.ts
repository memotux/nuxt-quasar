import { validateArrayValues } from './validation'

/**
 * Logger contract for `warnLegacyIconCss`. Accepts any object with a
 * `warn(message: string)` method — matches `ConsolaInstance` for real
 * usage and is trivially mockable in tests.
 */
export interface WarnLogger {
  warn: (message: string) => void
}

/**
 * The CSS icon font libraries shipped by `@quasar/extras` (pinned to v2.0.4).
 *
 * Deliberately excludes SVG-only icon sets (e.g. `ionicons-v8`, every `svg-*`
 * set) and text fonts (`roboto-font*`): this option selects CSS icon fonts
 * only. Use the free-form `css` option as the escape hatch for anything else.
 */
export const VALID_ICON_LIBRARIES = [
  'bootstrap-icons',
  'eva-icons',
  'fontawesome-v7',
  'ionicons-v4',
  'line-awesome',
  'material-icons',
  'material-icons-outlined',
  'material-icons-round',
  'material-icons-sharp',
  'material-symbols-outlined',
  'material-symbols-rounded',
  'material-symbols-sharp',
  'mdi-v7',
  'themify',
] as const

export type QuasarIconLibrary = typeof VALID_ICON_LIBRARIES[number]

/**
 * The `@quasar/extras` CSS paths covered by `iconLibraries`, used to detect
 * legacy `css` configuration that should migrate to the typed option.
 */
export const ICON_LIBRARY_CSS_PATHS: ReadonlySet<string> = new Set(
  VALID_ICON_LIBRARIES.map(name => iconLibraryCssPath(name)),
)

function iconLibraryCssPath(name: string): string {
  return `@quasar/extras/${name}/${name}.css`
}

export function normalizeIconLibraries(iconLibraries?: string[]): string[] {
  if (iconLibraries === undefined) return []
  return [...new Set(iconLibraries.filter(Boolean))]
}

export function validateIconLibraries(names: string[]): void {
  validateArrayValues(names, {
    validList: VALID_ICON_LIBRARIES,
    domain: 'icon library',
    domainPlural: 'icon libraries',
    allMessage: '\'all\' is not a valid icon library; list the libraries you need (e.g. \'material-icons\')',
  })
}

export function buildIconLibraryImports(names: string[]): string[] {
  return names.map(name => `import '${iconLibraryCssPath(name)}'`)
}

/**
 * Warn once per legacy `css` entry that the typed `iconLibraries` option now covers.
 *
 * Compatibility-first: the warning never throws and never mutates `css`, so the
 * existing import keeps working. Exact-path matching only — alias or `~` forms
 * are left alone.
 */
export function warnLegacyIconCss(css: string[], logger: WarnLogger): void {
  const legacyPaths = new Set(css.filter(path => ICON_LIBRARY_CSS_PATHS.has(path)))

  for (const path of legacyPaths) {
    const name = path.split('/')[2]
    // No `nuxt-quasar-vite:` prefix here — `useLogger('nuxt-quasar-vite')` already tags it.
    logger.warn(
      `css: ['${path}'] is superseded by iconLibraries: ['${name}']. `
      + 'The import is preserved for now; migrate when convenient.',
    )
  }
}
