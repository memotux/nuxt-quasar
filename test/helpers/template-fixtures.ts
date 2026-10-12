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

/** The `useHead` import emitted directly after the `#app` import. */
export const USE_HEAD_LINE = `import { useHead } from '#imports'`

/**
 * Exact source of the inlined SSR `_meta` bridge emitted before
 * `export default defineNuxtPlugin` in the generated plugin. Mirrors
 * `SSR_BRIDGE_CODE` in `src/internal/plugin-template.ts`; keep both in sync
 * (the escaped backslashes below produce the regexes' real `\w`-style
 * escapes in the emitted code).
 */
export const SSR_BRIDGE_CODE = `// Quasar SSR _meta -> Nuxt head bridge. Inlined so the virtual plugin
// needs no extra import; mirrors src/internal/ssr-bridge.ts (keep in sync).
interface QuasarSsrMetaTag {
  tag: 'meta' | 'link' | 'script' | 'style' | 'noscript' | 'title'
  attrs: Record<string, string>
  innerHTML?: string
}

function parseAttrString(attrs: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (!attrs?.trim()) return result
  const re = /([\\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\\S+)))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(attrs)) !== null) {
    const key = m[1]
    if (key === undefined) continue
    const val = m[2] ?? m[3] ?? m[4] ?? ''
    result[key] = val
  }
  return result
}

const MAX_HTML_INPUT = 10_000

function parseHtmlTags(html: string): QuasarSsrMetaTag[] {
  const tags: QuasarSsrMetaTag[] = []
  if (!html?.trim() || html.length > MAX_HTML_INPUT) return tags
  const re = /<(\\w+)((?:\\s+[\\w:-]+(?:=(?:"[^"]*"|'[^']*'|\\S+))?)*)\\s*(?:\\/>|>([\\s\\S]*?)<\\/\\1>|>)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const tagName = m[1]?.toLowerCase()
    if (!tagName) continue
    const attrsStr = m[2] || ''
    const inner = m[3]
    if (!['meta', 'link', 'script', 'style', 'noscript', 'title'].includes(tagName)) continue
    tags.push({
      tag: tagName as QuasarSsrMetaTag['tag'],
      attrs: parseAttrString(attrsStr),
      innerHTML: inner !== undefined ? inner : undefined,
    })
  }
  return tags
}

function buildHeadInput(meta: Record<string, string>): Record<string, unknown> {
  const bodyAttrs = parseAttrString(meta.bodyAttrs ?? '')
  const htmlAttrs = parseAttrString(meta.htmlAttrs ?? '')

  const bodyClasses = meta.bodyClasses?.trim()
  if (bodyClasses) {
    bodyAttrs.class = [bodyAttrs.class, bodyClasses].filter(Boolean).join(' ')
  }

  const allHeadTags = [...parseHtmlTags(meta.headTags ?? ''), ...parseHtmlTags(meta.endingHeadTags ?? '')]
  const bodyTagList = parseHtmlTags(meta.bodyTags ?? '')

  const input: Record<string, unknown> = {}
  if (Object.keys(bodyAttrs).length > 0) input.bodyAttrs = bodyAttrs
  if (Object.keys(htmlAttrs).length > 0) input.htmlAttrs = htmlAttrs

  const metaList: Record<string, string>[] = []
  const linkList: Record<string, string>[] = []
  const scriptList: Record<string, unknown>[] = []
  const styleList: Record<string, unknown>[] = []
  const noscriptList: Record<string, unknown>[] = []
  let title: string | undefined

  for (const t of [...allHeadTags, ...bodyTagList]) {
    if (t.tag === 'title') {
      title = t.innerHTML
      continue
    }
    const entry: Record<string, unknown> = { ...t.attrs }
    if (t.innerHTML !== undefined) entry.innerHTML = t.innerHTML
    switch (t.tag) {
      case 'meta':
        metaList.push(t.attrs)
        break
      case 'link':
        linkList.push(t.attrs)
        break
      case 'script':
        scriptList.push(entry)
        break
      case 'style':
        styleList.push(entry)
        break
      case 'noscript':
        noscriptList.push(entry)
        break
    }
  }

  if (title !== undefined) input.title = title
  if (metaList.length > 0) input.meta = metaList
  if (linkList.length > 0) input.link = linkList
  if (scriptList.length > 0) input.script = scriptList
  if (styleList.length > 0) input.style = styleList
  if (noscriptList.length > 0) input.noscript = noscriptList

  return input
}`

/**
 * The `_meta` -> `useHead` bridge block emitted inside `install`'s server
 * branch, directly after the `installQ(...)` call (10-space base indent).
 */
export const SERVER_BRIDGE_BLOCK = `          // Bridge Quasar SSR meta to Nuxt head so the SSR HTML carries
          // body classes (dark mode, platform) and head/body tags. The thunk
          // captures _meta fields Quasar fills in onRendered (Meta plugin).
          const ssrMeta = (nuxtApp.ssrContext!.event.node as { _meta?: Record<string, string> })._meta
          if (ssrMeta) {
            useHead(() => buildHeadInput(ssrMeta))
          }`

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
 * The DEFAULT `config` object and both arrays are constructed per call, so the
 * defaults themselves share no mutable reference between tests. Overrides are
 * different: the trailing `...overrides` spread copies the caller's references
 * verbatim, so a `plugins`, `css` or `config` value passed in is still the very
 * object the caller holds. A test that supplies an override and then mutates
 * that array/object mutates it through the shared reference — pass a fresh
 * literal when a test needs isolation.
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
 *
 * Contract: this only sees lines that START at column 0 with `import `, so an
 * indented import would be invisible to every ordering assertion that consumes
 * this helper. The template is pinned to that shape by the
 * "buildPluginContents (import line shape)" cases in
 * `test/plugin-template.test.ts`; update that guard if the emitter changes.
 */
export function importLines(contents: string): string[] {
  return contents.split('\n').filter(line => line.startsWith('import '))
}

/**
 * Extract full `import <name> from 'quasar/<module>/<x>.js'` statements from
 * generated-plugin contents, one per line. Lines are anchored (^...$ with the
 * m flag) so commented-out or malformed lines, and stray path fragments inside
 * string literals, cannot match — unlike a raw fragment count.
 */
export function parseQuasarNamedImports(contents: string, name: string, module: string): string[] {
  return contents.match(new RegExp(`^import ${name} from 'quasar/${module}/[^']+\\.js'$`, 'gm')) ?? []
}

/**
 * Extract full side-effect `import '<prefix>...'` statements from
 * generated-plugin contents, one per line. Lines are anchored (^...$ with
 * the m flag) so commented-out or malformed lines, and stray path fragments
 * in string literals, cannot match — unlike a raw fragment count.
 */
export function parseSideEffectImports(contents: string, prefix: string): string[] {
  return contents.match(new RegExp(`^import '${prefix}[^']+'$`, 'gm')) ?? []
}
