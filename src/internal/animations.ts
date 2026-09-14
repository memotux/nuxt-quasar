import { levenshteinDistance } from './levenshtein'

export const GENERAL_ANIMATIONS = [
  'bounce', 'flash', 'flip', 'headShake', 'heartBeat', 'hinge', 'jello', 'pulse', 'rubberBand',
  'shake', 'shakeX', 'shakeY', 'swing', 'tada', 'wobble',
] as const

export const IN_ANIMATIONS = [
  'backInDown', 'backInLeft', 'backInRight', 'backInUp', 'bounceIn', 'bounceInDown',
  'bounceInLeft', 'bounceInRight', 'bounceInUp', 'fadeIn', 'fadeInBottomLeft', 'fadeInBottomRight',
  'fadeInDown', 'fadeInDownBig', 'fadeInLeft', 'fadeInLeftBig', 'fadeInRight', 'fadeInRightBig',
  'fadeInTopLeft', 'fadeInTopRight', 'fadeInUp', 'fadeInUpBig', 'flipInX', 'flipInY',
  'jackInTheBox', 'lightSpeedInLeft', 'lightSpeedInRight', 'rollIn', 'rotateIn',
  'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight', 'slideInDown',
  'slideInLeft', 'slideInRight', 'slideInUp', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight',
  'zoomInUp',
] as const

export const OUT_ANIMATIONS = [
  'backOutDown', 'backOutLeft', 'backOutRight', 'backOutUp', 'bounceOut', 'bounceOutDown',
  'bounceOutLeft', 'bounceOutRight', 'bounceOutUp', 'fadeOut', 'fadeOutBottomLeft',
  'fadeOutBottomRight', 'fadeOutDown', 'fadeOutDownBig', 'fadeOutLeft', 'fadeOutLeftBig',
  'fadeOutRight', 'fadeOutRightBig', 'fadeOutTopLeft', 'fadeOutTopRight', 'fadeOutUp',
  'fadeOutUpBig', 'flipOutX', 'flipOutY', 'lightSpeedOutLeft', 'lightSpeedOutRight', 'rollOut',
  'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft', 'rotateOutUpRight',
  'slideOutDown', 'slideOutLeft', 'slideOutRight', 'slideOutUp', 'zoomOut', 'zoomOutDown',
  'zoomOutLeft', 'zoomOutRight', 'zoomOutUp',
] as const

export const VALID_ANIMATIONS = [
  ...GENERAL_ANIMATIONS, ...IN_ANIMATIONS, ...OUT_ANIMATIONS,
] as const

export type QuasarAnimation = typeof VALID_ANIMATIONS[number]

export const KNOWN_ORPHAN_ANIMATIONS = ['lightSpeedIn', 'lightSpeedOut'] as const

export function normalizeAnimations(animations?: 'all' | string[]): string[] {
  if (animations === undefined) return []
  if (animations === 'all') return [...VALID_ANIMATIONS]
  return [...new Set(animations.filter(Boolean))]
}

export function validateAnimations(names: string[]): void {
  const invalid = names.filter(name => !(VALID_ANIMATIONS as readonly string[]).includes(name))
  if (invalid.length === 0) return

  const details = invalid.map((name) => {
    if ((KNOWN_ORPHAN_ANIMATIONS as readonly string[]).includes(name)) {
      return `'${name}' exists in @quasar/extras but is not part of the typed animation list; use `
        + `css: ['@quasar/extras/animate/${name}.css']`
    }
    if (name === 'all') return '\'all\' is only valid as the string form: use animations: \'all\''

    const nearest = VALID_ANIMATIONS.reduce((best, candidate) => {
      return levenshteinDistance(name, candidate) < levenshteinDistance(name, best) ? candidate : best
    })
    const suggestion = levenshteinDistance(name, nearest) <= 3
      ? ` (did you mean '${nearest}'?)`
      : ''
    return `'${name}'${suggestion}`
  })

  throw new Error(
    `nuxt-quasar-vite: unknown Quasar animation(s): ${details.join(', ')}. `
    + 'See https://quasar.dev/options/animations',
  )
}

export function buildAnimationImports(names: string[]): string[] {
  return names.map(name => `import '@quasar/extras/animate/${name}.css'`)
}
