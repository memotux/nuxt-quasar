import { GENERATED_GENERAL_ANIMATIONS, GENERATED_IN_ANIMATIONS, GENERATED_ORPHAN_ANIMATIONS, GENERATED_OUT_ANIMATIONS } from './generated-quasar-lists'
import { validateArrayValues } from './validation'

export const GENERAL_ANIMATIONS = [
  ...GENERATED_GENERAL_ANIMATIONS,
] as const

export const IN_ANIMATIONS = [
  ...GENERATED_IN_ANIMATIONS,
] as const

export const OUT_ANIMATIONS = [
  ...GENERATED_OUT_ANIMATIONS,
] as const

export const VALID_ANIMATIONS = [
  ...GENERAL_ANIMATIONS, ...IN_ANIMATIONS, ...OUT_ANIMATIONS,
] as const

export type QuasarAnimation = typeof VALID_ANIMATIONS[number]

export const KNOWN_ORPHAN_ANIMATIONS = [
  ...GENERATED_ORPHAN_ANIMATIONS,
] as const

export function normalizeAnimations(animations?: 'all' | string[]): string[] {
  if (animations === undefined) return []
  if (animations === 'all') return [...VALID_ANIMATIONS]
  return [...new Set(animations.filter(Boolean))]
}

export function validateAnimations(names: string[]): void {
  validateArrayValues(names, {
    validList: VALID_ANIMATIONS,
    domain: 'animation',
    allMessage: '\'all\' is only valid as the string form: use animations: \'all\'',
    perItemHint: (name) => {
      if ((KNOWN_ORPHAN_ANIMATIONS as readonly string[]).includes(name)) {
        return `exists in @quasar/extras but is not part of the typed animation list; use css: ['@quasar/extras/animate/${name}.css']`
      }
      return undefined
    },
    errorSuffix: 'See https://quasar.dev/options/animations',
  })
}

export function buildAnimationImports(names: string[]): string[] {
  return names.map(name => `import '@quasar/extras/animate/${name}.css'`)
}
