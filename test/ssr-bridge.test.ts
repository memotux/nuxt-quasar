import { describe, it, expect } from 'vitest'
import type { QuasarSsrMeta } from '../src/internal/ssr-bridge'
import { buildHeadInput, parseAttrString, parseHtmlTags } from '../src/internal/ssr-bridge'
import { buildPluginContents } from '../src/internal'
import {
  makeBaseOpts,
  SERVER_BRIDGE_BLOCK,
  SSR_BRIDGE_CODE,
  USE_HEAD_LINE,
} from './helpers/template-fixtures'

/** Fresh all-empty meta record; only the field under test is overridden. */
function makeMeta(overrides?: Partial<QuasarSsrMeta>): QuasarSsrMeta {
  return {
    htmlAttrs: '',
    headTags: '',
    endingHeadTags: '',
    bodyClasses: '',
    bodyAttrs: '',
    bodyTags: '',
    ...overrides,
  }
}

describe('parseAttrString', () => {
  it('parses double-quoted, single-quoted, unquoted and bare attributes', () => {
    expect(parseAttrString('lang="en" dir=\'ltr\' content=foo data-dark-auto')).toEqual({
      'lang': 'en',
      'dir': 'ltr',
      'content': 'foo',
      'data-dark-auto': '',
    })
  })

  it('keeps attribute names containing dashes and colons', () => {
    expect(parseAttrString('http-equiv="refresh" data-qmeta="x" xml:lang="en"')).toEqual({
      'http-equiv': 'refresh',
      'data-qmeta': 'x',
      'xml:lang': 'en',
    })
  })

  it('parses the Quasar default body attrs string', () => {
    // Quasar initializes `bodyAttrs` with this bare attribute (install-quasar.js).
    expect(parseAttrString('data-server-rendered')).toEqual({ 'data-server-rendered': '' })
  })

  it('returns {} for empty or whitespace-only input', () => {
    expect(parseAttrString('')).toEqual({})
    expect(parseAttrString('   ')).toEqual({})
  })
})

describe('parseHtmlTags', () => {
  it('parses a title tag with its inner text', () => {
    expect(parseHtmlTags('<title>My App</title>')).toEqual([
      { tag: 'title', attrs: {}, innerHTML: 'My App' },
    ])
  })

  it('parses void meta and link tags that carry no closing tag', () => {
    // Quasar's Meta.js getHead() emits void elements with a bare '>'
    // (`<meta name="x" ...>`), never `</meta>`.
    const tags = parseHtmlTags(
      '<meta charset="utf-8" data-qmeta="x"><link rel="stylesheet" href="/a.css">',
    )
    expect(tags).toEqual([
      { tag: 'meta', attrs: { 'charset': 'utf-8', 'data-qmeta': 'x' }, innerHTML: undefined },
      { tag: 'link', attrs: { rel: 'stylesheet', href: '/a.css' }, innerHTML: undefined },
    ])
  })

  it('parses style, script and noscript tags with their inner content', () => {
    expect(parseHtmlTags(
      '<style>:root{--a:1}</style>'
      + '<script id="qmeta-init">window.__Q_META__={}</script>'
      + '<noscript data-qmeta="n">fallback</noscript>',
    )).toEqual([
      { tag: 'style', attrs: {}, innerHTML: ':root{--a:1}' },
      { tag: 'script', attrs: { id: 'qmeta-init' }, innerHTML: 'window.__Q_META__={}' },
      { tag: 'noscript', attrs: { 'data-qmeta': 'n' }, innerHTML: 'fallback' },
    ])
  })

  it('ignores tags outside the Quasar meta set and plain text', () => {
    expect(parseHtmlTags('<div class="x">hello</div><br>plain text')).toEqual([])
  })

  it('returns [] for empty or whitespace-only input', () => {
    expect(parseHtmlTags('')).toEqual([])
    expect(parseHtmlTags('  ')).toEqual([])
  })
})

describe('buildHeadInput', () => {
  it('returns {} for an all-empty meta record', () => {
    expect(buildHeadInput(makeMeta())).toEqual({})
  })

  it('merges bodyClasses into bodyAttrs.class, trimming Quasar\'s leading space', () => {
    // Dark.js produces a leading-space bodyClasses string (' body--dark').
    const input = buildHeadInput(makeMeta({
      bodyAttrs: 'data-server-rendered',
      bodyClasses: ' body--dark desktop no-touch',
    }))
    expect(input.bodyAttrs).toEqual({
      'data-server-rendered': '',
      'class': 'body--dark desktop no-touch',
    })
  })

  it('appends bodyClasses to a class already present in bodyAttrs', () => {
    const input = buildHeadInput(makeMeta({
      bodyAttrs: 'class="foo"',
      bodyClasses: 'body--dark',
    }))
    expect(input.bodyAttrs).toEqual({ class: 'foo body--dark' })
  })

  it('maps htmlAttrs into htmlAttrs', () => {
    const input = buildHeadInput(makeMeta({ htmlAttrs: 'lang="en" dir="ltr"' }))
    expect(input.htmlAttrs).toEqual({ lang: 'en', dir: 'ltr' })
  })

  it('routes headTags and endingHeadTags to title/meta/link/script/style', () => {
    const input = buildHeadInput(makeMeta({
      headTags: '<title>App</title><meta name="x" content="1"><link rel="icon" href="/f.png"><script>window.a=1</script>',
      endingHeadTags: '<style>:root{--a:1}</style>',
    }))
    expect(input.title).toBe('App')
    expect(input.meta).toEqual([{ name: 'x', content: '1' }])
    expect(input.link).toEqual([{ rel: 'icon', href: '/f.png' }])
    expect(input.script).toEqual([{ innerHTML: 'window.a=1' }])
    expect(input.style).toEqual([{ innerHTML: ':root{--a:1}' }])
    expect(input.bodyAttrs).toBeUndefined()
    expect(input.htmlAttrs).toBeUndefined()
  })

  it('routes bodyTags (noscript + init script) into the head input', () => {
    const input = buildHeadInput(makeMeta({
      bodyTags: '<noscript data-qmeta="n">fallback</noscript><script id="qmeta-init">window.__Q_META__={}</script>',
    }))
    expect(input.noscript).toEqual([{ 'data-qmeta': 'n', 'innerHTML': 'fallback' }])
    expect(input.script).toEqual([{ id: 'qmeta-init', innerHTML: 'window.__Q_META__={}' }])
  })

  it('omits empty lists and never emits empty containers', () => {
    const input = buildHeadInput(makeMeta({ headTags: '<title>Only a title</title>' }))
    expect(input).toEqual({ title: 'Only a title' })
  })
})

describe('generated plugin inlines the SSR _meta bridge (issue #10)', () => {
  // The general generated-plugin contract is pinned by
  // test/plugin-template.test.ts; these cases pin the bridge emission against
  // the fixture source of truth (test/helpers/template-fixtures.ts) so the
  // bridge cannot silently disappear from the template.
  const contents = buildPluginContents(makeBaseOpts())

  it('imports useHead from #imports directly after the #app import', () => {
    const lines = contents.split('\n')
    expect(lines).toContain(USE_HEAD_LINE)
    expect(lines.indexOf(USE_HEAD_LINE))
      .toBe(lines.indexOf('import { defineNuxtPlugin, onNuxtReady } from \'#app\'') + 1)
  })

  it('emits the inlined bridge functions before the default export', () => {
    expect(contents).toContain(SSR_BRIDGE_CODE)
    expect(contents.indexOf(SSR_BRIDGE_CODE))
      .toBeLessThan(contents.indexOf('export default defineNuxtPlugin'))
  })

  it('bridges _meta to useHead in the install server branch', () => {
    expect(contents).toContain(SERVER_BRIDGE_BLOCK)
  })
})
