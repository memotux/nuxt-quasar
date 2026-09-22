/**
 * Shared access layer for the drift guards. Each guard compares a curated name
 * list in `src/internal/*` against the real contents of the installed upstream
 * package (quasar, @quasar/extras).
 *
 * WHY THESE FAIL INSTEAD OF SKIPPING: a guard whose source is missing must be
 * RED, never silently absent. Vitest exits 0 when tests are skipped, so a
 * skipped guard silently removes drift protection without failing anything.
 * That is why there is no availability probe helper here: absence of the
 * upstream package is an installation defect, and it has to be reported with a
 * message that names both the failing path/specifier and the remedy.
 *
 * WHY FAILURES ARE CLASSIFIED: an unreachable source is not always an absent
 * package. A refused read (EACCES/EPERM) or an unclassified I/O failure
 * (ENAMETOOLONG, EIO, ...) reported as "the package is missing; install
 * devDependencies with `pnpm install`" sends the operator after a defect that
 * does not exist. Each class therefore gets its own wording, and only `missing`
 * may name the install remedy.
 *
 * These helpers only report the failure; each guard keeps its own filtering and
 * normalization rules, because those genuinely differ per guard.
 */
import type { Dirent } from 'node:fs'
import { readdir } from 'node:fs/promises'

/** Raised when a drift guard cannot reach the upstream data it must compare against. */
export class DriftSourceUnavailableError extends Error {
  override name = 'DriftSourceUnavailableError'
}

/** How a drift guard failed to reach the upstream data it compares against. */
export type DriftFailureClass = 'missing' | 'permission' | 'unknown'

/**
 * Codes that mean the upstream data is genuinely not there.
 *
 * Filesystem reads: ENOENT, plus ENOTDIR for a path that exists but is not a
 * directory. Module loads: ERR_MODULE_NOT_FOUND is what this repository's
 * vitest/vite-node run raises for a missing subpath, a missing bare package and
 * an unsupported file extension alike (observed directly, not assumed). The
 * remaining names are the plain-Node ESM equivalents, kept so a guard that runs
 * outside vite-node classifies the same way.
 */
const MISSING_CODES = new Set([
  'ENOENT',
  'ENOTDIR',
  'ERR_MODULE_NOT_FOUND',
  'ERR_INVALID_URL',
  'ERR_UNKNOWN_FILE_EXTENSION',
  'ERR_UNKNOWN_BUILTIN_MODULE',
  'ERR_UNSUPPORTED_ESM_URL_SCHEME',
])

/**
 * Codes that mean the read happened but was refused, which is NOT an absence.
 * Kept apart from `MISSING_CODES` precisely because the two need different
 * remedies.
 */
const PERMISSION_CODES = new Set(['EACCES', 'EPERM'])

/** What a drift guard was trying to reach, used to name it in the failure message. */
export interface DriftFailureTarget {
  /** `read` for directory listings, `load` for upstream module imports. */
  action: 'read' | 'load'
  /** The exact path or specifier that failed; always named in the message. */
  locator: string
  /** The noun standing for the upstream data in the message, e.g. `@quasar/extras`. */
  source: string
}

/** The `cause` chain, outermost first, stopping at cycles and non-object links. */
function causeChain(cause: unknown): unknown[] {
  const chain: unknown[] = []
  const seen = new Set<unknown>()
  let current: unknown = cause

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    chain.push(current)
    current = (current as { cause?: unknown }).cause
  }

  return chain
}

/** The errno or loader `code` of one link, or an empty string when it has none. */
function codeOf(link: unknown): string {
  const code = (link as { code?: unknown }).code
  return typeof code === 'string' ? code : ''
}

/**
 * Classify a drift-guard failure from the error codes across its `cause` chain.
 *
 * Pure on purpose: a permission failure must be classifiable, but a test cannot
 * produce a real EACCES without mutating filesystem rights outside the
 * repository, so the classification is derived from the error object alone.
 *
 * `permission` outranks `missing` wherever it appears in the chain: a wrapper
 * that reports "not found" over an underlying refusal would otherwise send the
 * operator back to `pnpm install`, which cannot change access rights.
 */
export function classifyDriftFailure(cause: unknown): DriftFailureClass {
  const chain = causeChain(cause)
  if (chain.some(link => PERMISSION_CODES.has(codeOf(link)))) {
    return 'permission'
  }
  return chain.some(link => MISSING_CODES.has(codeOf(link))) ? 'missing' : 'unknown'
}

/**
 * The deepest message in the chain: for an unclassified failure the specific
 * cause matters more than the wrapper that carried it.
 */
function causeMessage(cause: unknown): string {
  const chain = causeChain(cause)
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const link = chain[index]
    if (link instanceof Error && link.message) {
      return link.message
    }
  }
  return typeof cause === 'string' ? cause : 'no error message available'
}

/**
 * Message for one classified failure, used by both helpers.
 *
 * Exported beside the classifier so every branch's wording is pinnable by tests
 * without fabricating filesystem state; the two helpers are its only callers.
 */
export function describeDriftFailure(cause: unknown, target: DriftFailureTarget): string {
  const head = `drift guard cannot ${target.action} ${target.locator}`

  switch (classifyDriftFailure(cause)) {
    // The only branch allowed to name the install remedy: with the package
    // genuinely absent, running the install really is the fix.
    case 'missing':
      return `${head}: ${target.source} is missing; install devDependencies with \`pnpm install\``
    // A refusal is not an absence: never claim "missing" and never send the
    // operator to `pnpm install`, which cannot change access rights.
    case 'permission':
      return `${head}: the read was REFUSED (permission denied); ${target.source} is present but not readable by the current user`
    // An unclassified failure reports its underlying cause verbatim, because
    // that message is the only clue the operator gets, and claims nothing about
    // absence.
    default:
      return `${head}: the read failed for an unclassified reason (${causeMessage(cause)}); ${target.source} could not be verified`
  }
}

// Overloaded so callers get entry names, or Dirent entries when they ask for them.
export function readShippedDir(dir: string): Promise<string[]>
export function readShippedDir(dir: string, options: { withFileTypes: true }): Promise<Dirent[]>

/**
 * `readdir` for drift guards: fails loudly and actionably instead of letting a
 * guard skip when the upstream directory cannot be read.
 */
export async function readShippedDir(dir: string, options?: { withFileTypes: true }): Promise<string[] | Dirent[]> {
  try {
    return options ? await readdir(dir, options) : await readdir(dir)
  }
  catch (cause) {
    throw new DriftSourceUnavailableError(
      describeDriftFailure(cause, { action: 'read', locator: dir, source: 'the upstream package' }),
      { cause },
    )
  }
}

/**
 * Dynamic import of an upstream package path that fails loudly and actionably
 * instead of letting a guard skip when the package cannot be loaded.
 *
 * `attributes` is the second argument of `import()` itself, so a JSON specifier
 * such as `@quasar/extras/package.json` can carry `{ with: { type: 'json' } }`.
 * Plain Node ESM rejects a JSON module without that attribute
 * (ERR_IMPORT_ATTRIBUTE_MISSING), while vite-node accepts both forms, so an
 * omitted attribute would only surface in a runtime this suite does not cover.
 */
export async function loadUpstreamModule<T = unknown>(
  specifier: string,
  packageName: string,
  attributes?: ImportCallOptions,
): Promise<T> {
  try {
    return (attributes ? await import(specifier, attributes) : await import(specifier)) as T
  }
  catch (cause) {
    throw new DriftSourceUnavailableError(
      describeDriftFailure(cause, { action: 'load', locator: specifier, source: packageName }),
      { cause },
    )
  }
}
