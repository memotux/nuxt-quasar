import { describe, it, expect } from 'vitest'
import { normalizePlugins, validatePlugins, VALID_PLUGINS } from '../src/internal'

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
