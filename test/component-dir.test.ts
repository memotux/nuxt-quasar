import { describe, it, expect } from 'vitest'
import { buildComponentDir } from '../src/internal'

const QUASAR_SRC = '/node_modules/quasar/src/'

describe('buildComponentDir (F5: components:dirs hook)', () => {
  it('path is quasarSrc + components', () => {
    const dir = buildComponentDir(QUASAR_SRC)
    expect(dir.path).toBe(QUASAR_SRC + 'components')
  })

  it('transpile is true', () => {
    const dir = buildComponentDir(QUASAR_SRC)
    expect(dir.transpile).toBe(true)
  })

  it('watch is false', () => {
    const dir = buildComponentDir(QUASAR_SRC)
    expect(dir.watch).toBe(false)
  })

  it('pattern matches Q-prefixed JS files', () => {
    const dir = buildComponentDir(QUASAR_SRC)
    expect(dir.pattern).toBe('**/Q*.js')
  })

  it('ignore excludes test files and __tests__ directories', () => {
    const dir = buildComponentDir(QUASAR_SRC)
    expect(dir.ignore).toEqual(['**.test.js', '*/__tests__/*'])
  })

  it('pathPrefix is false (components registered without path prefix)', () => {
    const dir = buildComponentDir(QUASAR_SRC)
    expect(dir.pathPrefix).toBe(false)
  })

  it('uses the provided quasarSrc path', () => {
    const customSrc = '/custom/quasar/src/'
    const dir = buildComponentDir(customSrc)
    expect(dir.path).toBe('/custom/quasar/src/components')
  })

  it('returns exactly 6 fields (no extras)', () => {
    const dir = buildComponentDir(QUASAR_SRC)
    expect(Object.keys(dir)).toHaveLength(6)
  })
})
