/**
 * Compile-time guard that the `quasar` key is actually typed in the playground
 * program.
 *
 * Nuxt generates the key from `typeof import('nuxt-quasar-vite')`; the
 * playground resolves that specifier through `playground/types/nuxt-quasar-vite.d.ts`.
 * If that shim disappears, the key silently collapses to `Record<string, any>`
 * and `vue-tsc` still passes — unless a line here stops erroring. The
 * playground stage of `pnpm test:types` type-checks this file, so the silent
 * fallback becomes a build failure.
 */
import type { NuxtConfig } from '@nuxt/schema'

type QuasarOptions = Exclude<NuxtConfig['quasar'], boolean | undefined>

// A known key must be accepted.
export const _knownKey: QuasarOptions = { animations: ['fadeIn'], iconSet: 'mdi-v7' }

// An unknown key must be rejected. If the key falls back to `Record<string, any>`
// this directive becomes unused and `vue-tsc` fails.
// @ts-expect-error — unknown key must not be accepted
export const _unknownKey: QuasarOptions = { bogusKey: true }
