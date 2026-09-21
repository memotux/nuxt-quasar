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
 * These helpers only report the failure; each guard keeps its own filtering and
 * normalization rules, because those genuinely differ per guard.
 */
import type { Dirent } from 'node:fs'
import { readdir } from 'node:fs/promises'

/** Raised when a drift guard cannot reach the upstream data it must compare against. */
export class DriftSourceUnavailableError extends Error {
  override name = 'DriftSourceUnavailableError'
}

// Overloaded so callers get entry names, or Dirent entries when they ask for them.
export function readShippedDir(dir: string): Promise<string[]>
export function readShippedDir(dir: string, options: { withFileTypes: true }): Promise<Dirent[]>

/**
 * `readdir` for drift guards: fails loudly and actionably instead of letting a
 * guard skip when the upstream directory is missing.
 */
export async function readShippedDir(dir: string, options?: { withFileTypes: true }): Promise<string[] | Dirent[]> {
  try {
    return options ? await readdir(dir, options) : await readdir(dir)
  }
  catch (cause) {
    throw new DriftSourceUnavailableError(
      `drift guard cannot read ${dir}: the upstream package is missing; install devDependencies with \`pnpm install\``,
      { cause },
    )
  }
}

/**
 * Dynamic import of an upstream package path that fails loudly and actionably
 * instead of letting a guard skip when the package is missing.
 */
export async function loadUpstreamModule<T = unknown>(specifier: string, packageName: string): Promise<T> {
  try {
    return await import(specifier) as T
  }
  catch (cause) {
    throw new DriftSourceUnavailableError(
      `drift guard cannot load ${specifier}: ${packageName} is missing; install devDependencies with \`pnpm install\``,
      { cause },
    )
  }
}
