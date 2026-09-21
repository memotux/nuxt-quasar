import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { DriftSourceUnavailableError, loadUpstreamModule, readShippedDir } from './helpers/drift'

const helpersDir = fileURLToPath(new URL('./helpers/', import.meta.url))
const missingDir = fileURLToPath(new URL('../node_modules/quasar/lang-does-not-exist', import.meta.url))
type AnimateList = Record<'generalAnimations' | 'inAnimations' | 'outAnimations', unknown>

describe('readShippedDir (helper contract)', () => {
  it('fails loudly with an actionable message when the upstream directory is missing', async () => {
    const promise = readShippedDir(missingDir)
    await expect(promise).rejects.toThrowError(DriftSourceUnavailableError)
    const error = await promise.catch(error => error) as DriftSourceUnavailableError
    expect(error.name).toBe('DriftSourceUnavailableError')
    expect(error.message).toBe(
      `drift guard cannot read ${missingDir}: the upstream package is missing; install devDependencies with \`pnpm install\``,
    )
    // The remedy is the feature: a guard that fails without telling the operator
    // how to fix it is only marginally better than the silent skip it replaces.
    expect(error.message).toContain('pnpm install')
    expect(error.cause).toBeDefined()
    expect(error.cause).toBeInstanceOf(Error)
  })

  it('returns entry names for a real directory', async () => {
    const entries = await readShippedDir(helpersDir)
    expect(entries).toContain('drift.ts')
    expect(entries).toContain('template-fixtures.ts')
  })

  it('returns Dirent entries when asked for file types', async () => {
    const entries = await readShippedDir(helpersDir, { withFileTypes: true })
    expect(entries.some(entry => entry.isFile())).toBe(true)
  })
})

describe('loadUpstreamModule (helper contract)', () => {
  it('fails loudly with an actionable message when the specifier cannot be loaded', async () => {
    const specifier = '@quasar/extras/animate/does-not-exist'
    const promise = loadUpstreamModule(specifier, '@quasar/extras')
    await expect(promise).rejects.toThrowError(DriftSourceUnavailableError)
    const error = await promise.catch(error => error) as DriftSourceUnavailableError
    expect(error.message).toBe(
      `drift guard cannot load ${specifier}: @quasar/extras is missing; install devDependencies with \`pnpm install\``,
    )
  })

  it('resolves a real upstream module', async () => {
    const animateList = await loadUpstreamModule<AnimateList>('@quasar/extras/animate/animate-list.common', '@quasar/extras')
    expect(Array.isArray(animateList.generalAnimations)).toBe(true)
    expect(Array.isArray(animateList.inAnimations)).toBe(true)
    expect(Array.isArray(animateList.outAnimations)).toBe(true)
  })
})
