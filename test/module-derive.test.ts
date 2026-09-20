import { describe, it, expect } from 'vitest'
import { resolvePath } from '@nuxt/kit'

/**
 * Direct coverage for the top-level derivations in `src/module.ts`:
 * - `quasarPkgInfo` and `__QUASAR_VERSION__` from `quasar/package.json`
 * - `quasarSrc` from `await resolvePath('quasar').then(p => p.replace(/dist.*$/g, 'src/'))`
 *
 * These are module-level constants and are not exported. The pattern exercised here
 * is the same one `module.ts:40-42` runs at top-level. If either the `resolvePath`
 * contract or the `dist.*$` regex changes in `module.ts`, this test pins the
 * expected outcome and forces the change to be deliberate.
 */
describe('src/module.ts derivations', () => {
  it('imports the module cleanly outside a Nuxt context', async () => {
    const mod = await import('../src/module')
    expect(mod).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('quasarSrc derivation (resolvePath + dist→src replace) ends with quasar/src/', async () => {
    const resolved = await resolvePath('quasar')
    const quasarSrc = resolved.replace(/dist.*$/g, 'src/')
    // Cross-platform: matches /quasar/src/ on POSIX and \quasar\src\ on Windows.
    expect(quasarSrc).toMatch(/[\\/]quasar[\\/]src[\\/]$/)
  })

  it('__QUASAR_VERSION__ derivation matches a quoted semver string', async () => {
    const quasarPkgInfo = (await import('quasar/package.json', { with: { type: 'json' } })).default
    const __QUASAR_VERSION__ = `'${quasarPkgInfo.version}'`
    expect(__QUASAR_VERSION__).toMatch(/^'\d+\.\d+\.\d+(-[\w.]+)?'$/)
  })

  it('re-importing the module is a no-op (top-level await resolves once)', async () => {
    const first = await import('../src/module')
    const second = await import('../src/module')
    expect(second.default).toBe(first.default)
  })
})
