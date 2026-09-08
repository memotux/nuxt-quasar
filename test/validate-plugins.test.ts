import { describe, it, expect } from 'vitest'
import { validatePlugins, VALID_PLUGINS } from '../src/internal'

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
