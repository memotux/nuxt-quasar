import { describe, it, expect } from 'vitest'
import { buildDefineMatrix } from '../src/internal'

const QUASAR_VERSION = `'2.27.0'`

describe('buildDefineMatrix (F1: SSR define matrix)', () => {
  describe('all combinations of ssr × server × client', () => {
    const scenarios = [
      { label: 'SSR off, server call', ssrEnabled: false, isServer: true, isClient: false },
      { label: 'SSR off, client call', ssrEnabled: false, isServer: false, isClient: true },
      { label: 'SSR on, server call', ssrEnabled: true, isServer: true, isClient: false },
      { label: 'SSR on, client call', ssrEnabled: true, isServer: false, isClient: true },
      { label: 'SSR on, neither (edge)', ssrEnabled: true, isServer: false, isClient: false },
      { label: 'SSR off, neither', ssrEnabled: false, isServer: false, isClient: false },
    ]

    for (const { label, ssrEnabled, isServer, isClient } of scenarios) {
      it(`${label}: produces all 5 define keys with correct values`, () => {
        const result = buildDefineMatrix(ssrEnabled, isServer, isClient, QUASAR_VERSION)

        expect(Object.keys(result)).toEqual([
          '__QUASAR_VERSION__',
          '__QUASAR_SSR__',
          '__QUASAR_SSR_SERVER__',
          '__QUASAR_SSR_CLIENT__',
          '__QUASAR_SSR_PWA__',
        ])

        // __QUASAR_VERSION__ always present
        expect(result.__QUASAR_VERSION__).toBe(QUASAR_VERSION)

        // __QUASAR_SSR__ mirrors ssrEnabled exactly
        expect(result.__QUASAR_SSR__).toBe(ssrEnabled)

        // __QUASAR_SSR_SERVER__ is true only when both isServer AND ssrEnabled
        expect(result.__QUASAR_SSR_SERVER__).toBe(isServer && ssrEnabled)

        // __QUASAR_SSR_CLIENT__ is true only when both isClient AND ssrEnabled
        expect(result.__QUASAR_SSR_CLIENT__).toBe(isClient && ssrEnabled)

        // __QUASAR_SSR_PWA__ is a deliberate constant: Quasar's PWA mode is a
        // quasar CLI concern that Nuxt does not use, so the define is pinned
        // false for both bundles. If a future PWA option lands, the shape-pin
        // test forces this file to be revisited.
        expect(result.__QUASAR_SSR_PWA__).toBe(false)
      })
    }
  })

  it('SSR on + server: SERVER true, CLIENT false', () => {
    const result = buildDefineMatrix(true, true, false, QUASAR_VERSION)
    expect(result.__QUASAR_SSR__).toBe(true)
    expect(result.__QUASAR_SSR_SERVER__).toBe(true)
    expect(result.__QUASAR_SSR_CLIENT__).toBe(false)
  })

  it('SSR on + client: SERVER false, CLIENT true', () => {
    const result = buildDefineMatrix(true, false, true, QUASAR_VERSION)
    expect(result.__QUASAR_SSR__).toBe(true)
    expect(result.__QUASAR_SSR_SERVER__).toBe(false)
    expect(result.__QUASAR_SSR_CLIENT__).toBe(true)
  })

  it('SSR off + server: both SERVER and CLIENT false', () => {
    const result = buildDefineMatrix(false, true, false, QUASAR_VERSION)
    expect(result.__QUASAR_SSR__).toBe(false)
    expect(result.__QUASAR_SSR_SERVER__).toBe(false)
    expect(result.__QUASAR_SSR_CLIENT__).toBe(false)
  })

  it('SSR off + client: both SERVER and CLIENT false', () => {
    const result = buildDefineMatrix(false, false, true, QUASAR_VERSION)
    expect(result.__QUASAR_SSR__).toBe(false)
    expect(result.__QUASAR_SSR_SERVER__).toBe(false)
    expect(result.__QUASAR_SSR_CLIENT__).toBe(false)
  })

  it('preserves the exact version string format', () => {
    const version = `'3.0.0-beta.1'`
    const result = buildDefineMatrix(false, false, false, version)
    expect(result.__QUASAR_VERSION__).toBe(`'3.0.0-beta.1'`)
  })

  it('returns exactly 5 keys (no extra defines)', () => {
    const result = buildDefineMatrix(true, true, false, QUASAR_VERSION)
    expect(Object.keys(result)).toHaveLength(5)
  })

  it('emits exactly the five known define keys (shape pin: adding or renaming a define is deliberate)', () => {
    const result = buildDefineMatrix(true, true, false, QUASAR_VERSION)
    // Default JS sort compares UTF-16 code units, so `__QUASAR_SSR__` (whose
    // next character is `_`) sorts after the `__QUASAR_SSR_*` names.
    expect(Object.keys(result).sort()).toEqual([
      '__QUASAR_SSR_CLIENT__',
      '__QUASAR_SSR_PWA__',
      '__QUASAR_SSR_SERVER__',
      '__QUASAR_SSR__',
      '__QUASAR_VERSION__',
    ])
  })
})
