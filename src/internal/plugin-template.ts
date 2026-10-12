import type { QuasarUIConfiguration } from 'quasar'
import { buildAnimationImports } from './animations'
import { buildIconLibraryImports } from './icon-libraries'
import { iconSetImportLine } from './icon-set'
import { langImportLine } from './lang'

/** Indentation of the `config` field inside the generated `includes` object (`setup()` body). */
const CONFIG_FIELD_INDENT = '      '

/**
 * Source of the SSR `_meta` -> `useHead` bridge inlined into the generated
 * virtual plugin (issue #10). Inlined instead of imported so the virtual
 * plugin needs no extra module resolution. The expected-output copy lives in
 * `test/helpers/template-fixtures.ts` (`SSR_BRIDGE_CODE`); keep both in sync.
 */
const SSR_BRIDGE_CODE = `// Quasar SSR _meta -> Nuxt head bridge. Inlined so the virtual plugin
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

function parseHtmlTags(html: string): QuasarSsrMetaTag[] {
  const tags: QuasarSsrMetaTag[] = []
  if (!html?.trim()) return tags
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

export interface PluginTemplateOptions {
  plugins: string[]
  css: string[]
  animations?: string[]
  iconLibraries?: string[]
  iconSet?: string
  lang?: string
  config: QuasarUIConfiguration | undefined
  quasarVersion: string
}

/**
 * Generate the virtual plugin template content for `addPluginTemplate`.
 *
 * Produces a Nuxt plugin that installs Quasar with the configured plugins,
 * CSS imports, and config. Handles SSR install branching and client-side
 * SSR hydration takeover via `onSSRHydrated`.
 */
export function buildPluginContents(opts: PluginTemplateOptions): string {
  // JSON.stringify emits its tree from column 0; shift it into the `includes`
  // block so the closing brace aligns with `config:` instead of column 0.
  // The optional chain keeps the `config: undefined` output when unset.
  const config = JSON.stringify(opts.config, null, 2)
    ?.replace(/\n/g, `\n${CONFIG_FIELD_INDENT}`)
  const plugins = opts.plugins.join(',')
  const animations = buildAnimationImports(opts.animations ?? []).join('\n')
  const iconLibraries = buildIconLibraryImports(opts.iconLibraries ?? []).join('\n')
  const css = opts.css?.map(s => `import '${s}'`).join('\n') || ''
  // module.ts validates iconSet and lang before wiring them here;
  // undefined means "not configured", not "needs re-validation".
  const iconSetImport = opts.iconSet ? iconSetImportLine(opts.iconSet) : ''
  const iconSetEntry = iconSetImport ? '\n      iconSet,' : ''
  const langImport = opts.lang ? langImportLine(opts.lang) : ''
  const langEntry = langImport ? '\n      lang,' : ''
  // Import order is deterministic: iconSet -> lang -> animations -> icon libraries -> free-form css.
  // Empty groups drop out so no blank import lines are emitted.
  const importGroups = [iconSetImport, langImport, animations, iconLibraries, css].filter(Boolean).join('\n')

  return `import type { Plugin } from 'vue'
import { defineNuxtPlugin, onNuxtReady } from '#app'
import { useHead } from '#imports'
import installQ from 'quasar/src/install-quasar.js'
import { ${plugins} } from 'quasar/src/plugins.js'
import * as directives from 'quasar/src/directives.js'

${importGroups}

${SSR_BRIDGE_CODE}

export default defineNuxtPlugin({
  name: 'nuxt:quasar-install',
  setup(nuxtApp) {
    const includes = {
      directives,
      plugins: { ${plugins} },
      config: ${config},${iconSetEntry}${langEntry}
    }

    const quasarPlugin: Plugin & { version: string } = {
      version: ${opts.quasarVersion},
      install(app, opts) {
        if(import.meta.server) {
          installQ(app, {...opts, ...includes}, nuxtApp.ssrContext!.event.node)
          // Bridge Quasar SSR meta to Nuxt head so the SSR HTML carries
          // body classes (dark mode, platform) and head/body tags. The thunk
          // captures _meta fields Quasar fills in onRendered (Meta plugin).
          const ssrMeta = (nuxtApp.ssrContext!.event.node as { _meta?: Record<string, string> })._meta
          if (ssrMeta) {
            useHead(() => buildHeadInput(ssrMeta))
          }
        } else {
          installQ(app, {...opts, ...includes})
        }
      },
    }

    nuxtApp.vueApp.use(quasarPlugin)

    if (import.meta.client) {
      onNuxtReady(() => {
        // Quasar SSR hydration takeover: with __QUASAR_SSR_CLIENT__ enabled,
        // Screen/Platform/Meta/Body defer client init to $q.onSSRHydrated(),
        // which the SSR application must call once hydration completes.
        const $q = nuxtApp.vueApp.config.globalProperties.$q as { onSSRHydrated?: () => void } | undefined
        $q?.onSSRHydrated?.()
      })
    }
  }
})
`
}
