import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import {
  DriftSourceUnavailableError,
  classifyDriftFailure,
  describeDriftFailure,
  loadUpstreamModule,
  readShippedDir,
} from './helpers/drift'

const helpersDir = fileURLToPath(new URL('./helpers/', import.meta.url))
const missingDir = fileURLToPath(new URL('../node_modules/quasar/lang-does-not-exist', import.meta.url))

// A real EACCES cannot be produced here without mutating filesystem rights
// outside the repository, which is exactly why the classifier is pure: a code
// on the error object is the whole input it needs.
const permissionDenied = Object.assign(new Error(`EACCES: permission denied, scandir '${missingDir}'`), { code: 'EACCES' })

// ENAMETOOLONG is the one unclassified I/O failure of this set that a test can
// provoke for real: the path exists as far as the syscall is concerned, the
// kernel simply refuses to evaluate it.
const overlongName = 'a'.repeat(300)
const overlongDir = `./${overlongName}`

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

  it('reports an unclassified read failure without claiming the upstream package is missing', async () => {
    const error = await readShippedDir(overlongDir).catch(error => error) as DriftSourceUnavailableError
    expect(error).toBeInstanceOf(DriftSourceUnavailableError)
    expect(error.message).toBe(
      `drift guard cannot read ${overlongDir}: the read failed for an unclassified reason `
      + `(ENAMETOOLONG: name too long, scandir '${overlongDir}'); the upstream package could not be verified`,
    )
    // The misdiagnosis this wording exists to prevent: neither absence nor the
    // install remedy belongs in a failure the classifier could not identify.
    expect(error.message).not.toContain('is missing')
    expect(error.message).not.toContain('pnpm install')
    expect(error.cause).toBeDefined()
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
    expect(error.message).toContain('pnpm install')
  })

  it('resolves a real upstream module, JSON import attribute included', async () => {
    // Deliberately the package manifest and not a deep path: it is the layout
    // stable file of a guaranteed devDependency, so this case pins the helper's
    // attribute plumbing rather than an upstream directory layout. The attribute
    // is what plain Node ESM requires for a JSON specifier; vite-node tolerates
    // its absence, so without this case nothing here would notice it going away.
    const packageJson = await loadUpstreamModule<{ default: { name: string } }>(
      '@quasar/extras/package.json',
      '@quasar/extras',
      { with: { type: 'json' } },
    )
    expect(packageJson.default.name).toBe('@quasar/extras')
  })
})

describe('classifyDriftFailure (pure classifier)', () => {
  it('classifies a refused read as permission, wrapped or not', () => {
    expect(classifyDriftFailure(permissionDenied)).toBe('permission')
    expect(classifyDriftFailure(new Error('wrapper', { cause: permissionDenied }))).toBe('permission')
  })

  it('lets permission outrank a misleading not-found wrapper', () => {
    // A loader wrapper that reports "not found" over a refused read would send
    // the operator to `pnpm install`, so the refusal wins the classification.
    const wrapper = Object.assign(new Error('Cannot find package'), {
      code: 'ERR_MODULE_NOT_FOUND',
      cause: permissionDenied,
    })
    expect(classifyDriftFailure(wrapper)).toBe('permission')
  })

  it('classifies a missing directory as missing', async () => {
    const error = await readShippedDir(missingDir).catch(error => error) as DriftSourceUnavailableError
    expect(classifyDriftFailure(error.cause)).toBe('missing')
    // The wrapper carries no code of its own, so classifying it at all relies on
    // the `cause` chain walk.
    expect(classifyDriftFailure(error)).toBe('missing')
  })

  it('classifies an unloadable specifier as missing', async () => {
    const error = await loadUpstreamModule('@quasar/extras/animate/does-not-exist', '@quasar/extras')
      .catch(error => error) as DriftSourceUnavailableError
    expect(classifyDriftFailure(error)).toBe('missing')
  })

  it('classifies an unrecognised I/O failure as unknown', async () => {
    const error = await readShippedDir(overlongDir).catch(error => error) as DriftSourceUnavailableError
    expect(classifyDriftFailure(error.cause)).toBe('unknown')
  })

  it('classifies a non-error cause as unknown', () => {
    expect(classifyDriftFailure('boom')).toBe('unknown')
    expect(classifyDriftFailure(undefined)).toBe('unknown')
    expect(classifyDriftFailure(new Error('no code at all'))).toBe('unknown')
  })
})

describe('describeDriftFailure (wording per class)', () => {
  it('keeps the install remedy for the missing class only', () => {
    const missing = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
    expect(describeDriftFailure(missing, { action: 'read', locator: missingDir, source: 'the upstream package' })).toBe(
      `drift guard cannot read ${missingDir}: the upstream package is missing; install devDependencies with \`pnpm install\``,
    )
  })

  it('names the refused path and withholds both the absence claim and the remedy', () => {
    const message = describeDriftFailure(permissionDenied, {
      action: 'read',
      locator: missingDir,
      source: 'the upstream package',
    })
    expect(message).toBe(
      `drift guard cannot read ${missingDir}: the read was REFUSED (permission denied); `
      + 'the upstream package is present but not readable by the current user',
    )
    expect(message).toContain(missingDir)
    expect(message).not.toContain('is missing')
    expect(message).not.toContain('pnpm install')
  })

  it('names the refused specifier for the load action too', () => {
    const specifier = '@quasar/extras/package.json'
    const message = describeDriftFailure(permissionDenied, {
      action: 'load',
      locator: specifier,
      source: '@quasar/extras',
    })
    expect(message).toBe(
      `drift guard cannot load ${specifier}: the read was REFUSED (permission denied); `
      + '@quasar/extras is present but not readable by the current user',
    )
    expect(message).not.toContain('is missing')
    expect(message).not.toContain('pnpm install')
  })

  it('carries the underlying cause message for the unknown class', () => {
    const unknown = Object.assign(new Error('EIO: i/o error, scandir'), { code: 'EIO' })
    const message = describeDriftFailure(new Error('wrapper', { cause: unknown }), {
      action: 'read',
      locator: missingDir,
      source: 'the upstream package',
    })
    expect(message).toBe(
      `drift guard cannot read ${missingDir}: the read failed for an unclassified reason `
      + '(EIO: i/o error, scandir); the upstream package could not be verified',
    )
    expect(message).not.toContain('is missing')
    expect(message).not.toContain('pnpm install')
  })
})
