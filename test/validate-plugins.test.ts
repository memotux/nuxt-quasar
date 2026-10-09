import { describe, it, expect } from 'vitest'
import { GENERATED_QUASAR_PLUGINS, normalizePlugins, validatePlugins, VALID_PLUGINS } from '../src/internal'

describe('validatePlugins', () => {
  it('accepts valid plugin names', () => {
    expect(() => validatePlugins(['Notify', 'Dialog'])).not.toThrow()
  })

  it('accepts all valid plugins', () => {
    expect(() => validatePlugins([...VALID_PLUGINS])).not.toThrow()
  })

  it('throws on single invalid plugin name with clear message', () => {
    expect(() => validatePlugins(['Notifi']))
      .toThrow(/unknown Quasar plugin.*Notifi/)
    expect(() => validatePlugins(['Notifi']))
      .toThrow(/Valid plugins:/)
  })

  it('reports all invalid entries at once', () => {
    expect(() => validatePlugins(['Foo', 'Bar']))
      .toThrow(/Foo.*Bar/)
  })

  it('accepts empty array', () => {
    expect(() => validatePlugins([])).not.toThrow()
  })
})

describe('validatePlugins Quasar 2.34+ gating (QAS-3)', () => {
  const FULL_SURFACE = [...GENERATED_QUASAR_PLUGINS]
  // Quasar 2.27-shaped surface: the installed upstream inventory minus the
  // 2.34+ additions.
  const QUASAR_227_SURFACE = FULL_SURFACE.filter(
    name => name !== 'AppNetwork' && name !== 'AppWakeLock',
  )

  it('lists AppNetwork and AppWakeLock as selectable opt-in plugins', () => {
    expect(VALID_PLUGINS).toContain('AppNetwork')
    expect(VALID_PLUGINS).toContain('AppWakeLock')
  })

  it('accepts the new plugins against a full export surface', () => {
    expect(() =>
      validatePlugins(['AppNetwork', 'AppWakeLock', 'Notify'], {
        exportedPlugins: FULL_SURFACE,
        quasarVersion: '2.35.0',
        sourceLabel: 'quasar/src/plugins.js',
      }),
    ).not.toThrow()
  })

  it('rejects AppNetwork on a Quasar-2.27-shaped surface with an actionable error', () => {
    expect(() =>
      validatePlugins(['AppNetwork'], {
        exportedPlugins: QUASAR_227_SURFACE,
        quasarVersion: '2.27.0',
        sourceLabel: 'quasar/src/plugins.js',
      }),
    ).toThrow(/AppNetwork/)
    expect(() =>
      validatePlugins(['AppNetwork'], {
        exportedPlugins: QUASAR_227_SURFACE,
        quasarVersion: '2.27.0',
        sourceLabel: 'quasar/src/plugins.js',
      }),
    ).toThrow(/2\.34/)
    expect(() =>
      validatePlugins(['AppNetwork'], {
        exportedPlugins: QUASAR_227_SURFACE,
        quasarVersion: '2.27.0',
        sourceLabel: 'quasar/src/plugins.js',
      }),
    ).toThrow(/2\.27\.0/)
  })

  it('rejects AppWakeLock on a Quasar-2.27-shaped surface while baseline plugins stay valid', () => {
    expect(() =>
      validatePlugins(['AppWakeLock'], {
        exportedPlugins: QUASAR_227_SURFACE,
        quasarVersion: '2.27.0',
        sourceLabel: 'quasar/src/plugins.js',
      }),
    ).toThrow(/AppWakeLock.*2\.34|2\.34.*AppWakeLock/)
    expect(() =>
      validatePlugins(['Notify', 'Dialog'], {
        exportedPlugins: QUASAR_227_SURFACE,
        quasarVersion: '2.27.0',
        sourceLabel: 'quasar/src/plugins.js',
      }),
    ).not.toThrow()
  })

  it('keeps today\'s behavior when the export surface is omitted', () => {
    expect(() => validatePlugins(['AppNetwork', 'AppWakeLock'])).not.toThrow()
    expect(() => validatePlugins(['Notify'])).not.toThrow()
    expect(() => validatePlugins(['Notifi'])).toThrow(/unknown Quasar plugin/)
  })
})

describe('normalizePlugins', () => {
  it('deduplicates entries preserving first-occurrence order', () => {
    expect(normalizePlugins(['Notify', 'Dialog', 'Notify'])).toEqual(['Notify', 'Dialog'])
  })

  it('returns the list unchanged when there are no duplicates', () => {
    expect(normalizePlugins(['Notify', 'Dialog'])).toEqual(['Notify', 'Dialog'])
  })

  it('returns an empty array for undefined', () => {
    expect(normalizePlugins(undefined)).toEqual([])
  })

  it('drops falsy entries', () => {
    expect(normalizePlugins(['Notify', '', 'Dialog'])).toEqual(['Notify', 'Dialog'])
  })

  it('deduplicates the defu-merged shape (user list first, defaults appended)', () => {
    // Shape produced by Nuxt's defu merge when the user re-declares the
    // module default 'Notify': user list first, default-only entries appended.
    expect(normalizePlugins(['Notify', 'Dialog', 'LocalStorage', 'Notify']))
      .toEqual(['Notify', 'Dialog', 'LocalStorage'])
  })
})

describe('plugins curation reconciliation', () => {
  it('keeps the curated set a strict subset of the generated upstream inventory', () => {
    // Generation must not expand the public auto-install set: every curated
    // name must still be shipped upstream, without the curated list growing
    // to cover every upstream plugin.
    for (const name of VALID_PLUGINS) {
      expect(GENERATED_QUASAR_PLUGINS).toContain(name)
    }
    expect(GENERATED_QUASAR_PLUGINS.length).toBeGreaterThan(VALID_PLUGINS.length)
  })

  it('fails loudly on a curated name the installed Quasar no longer ships', () => {
    const removed = [...VALID_PLUGINS].filter(
      name => !(GENERATED_QUASAR_PLUGINS as readonly string[]).includes(name),
    )
    expect(removed).toEqual([])
  })
})
