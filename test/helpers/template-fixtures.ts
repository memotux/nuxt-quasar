/**
 * Single source of truth for the generated-plugin fixtures shared by the
 * template tests. Two kinds of value live here, and they are not
 * interchangeable:
 *
 * 1. Import LINES (`*_LINE`, `iconLibraryImport`, `iconSetImport`,
 *    `langImport`): what `buildPluginContents` EMITS. Use them in `toContain`
 *    and `indexOf` assertions.
 * 2. Option SPECIFIERS (`CSS_SPECIFIER`, `QUASAR_VERSION`): bare values passed
 *    INTO the generator, which wraps them itself. Never put a LINE where a
 *    specifier is expected; `css: [CSS_LINE]` emits
 *    `import 'import 'quasar/...''`.
 *
 * Keep these in sync with `src/internal/plugin-template.ts` instead of
 * re-declaring them per describe block.
 */
import type { PluginTemplateOptions } from '../../src/internal'

/** Quasar version as it appears in the generated template (`version: '2.27.0'`). */
export const QUASAR_VERSION = `'2.27.0'`

/** Bare css option value; the generator wraps it into `CSS_LINE`. */
export const CSS_SPECIFIER = 'quasar/src/css/index.sass'

export const ANIMATION_LINE = `import '@quasar/extras/animate/fadeIn.css'`
export const CSS_LINE = `import '${CSS_SPECIFIER}'`
export const DIRECTIVES_LINE = `import * as directives from 'quasar/src/directives.js'`

export function iconLibraryImport(name: string): string {
  return `import '@quasar/extras/${name}/${name}.css'`
}

export function iconSetImport(name: string): string {
  return `import iconSet from 'quasar/icon-set/${name}.js'`
}

export function langImport(name: string): string {
  return `import lang from 'quasar/lang/${name}.js'`
}

/**
 * Build a fresh base options object for `buildPluginContents`.
 *
 * The `config` object and both arrays are constructed per call so no mutable
 * reference is shared between tests.
 */
export function makeBaseOpts(overrides?: Partial<PluginTemplateOptions>): PluginTemplateOptions {
  return {
    plugins: ['Notify'],
    css: [CSS_SPECIFIER],
    config: { dark: true },
    quasarVersion: QUASAR_VERSION,
    ...overrides,
  }
}

/**
 * The `import` lines emitted by `buildPluginContents`, in the order they appear.
 *
 * The template emits every import group in one fixed total order, so asserting
 * this array once covers every pairwise ordering assertion.
 */
export function importLines(contents: string): string[] {
  return contents.split('\n').filter(line => line.startsWith('import '))
}
