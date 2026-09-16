import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  VALID_ANIMATIONS,
  buildAnimationImports,
  normalizeAnimations,
  validateAnimations,
} from '../src/internal'
import {
  GENERAL_ANIMATIONS,
  IN_ANIMATIONS,
  OUT_ANIMATIONS,
} from '../src/internal/animations'

const expectedAnimations = [...GENERAL_ANIMATIONS, ...IN_ANIMATIONS, ...OUT_ANIMATIONS]

let extrasAvailable = true
let animateList: {
  generalAnimations: string[]
  inAnimations: string[]
  outAnimations: string[]
} | undefined
try {
  animateList = await import('@quasar/extras/animate/animate-list.common') as unknown as typeof animateList
}
catch {
  extrasAvailable = false
}

describe('animations', () => {
  it('accepts valid animation names', () => {
    expect(() => validateAnimations(['fadeIn', 'bounce', 'zoomOut'])).not.toThrow()
  })

  it('accepts all valid animations', () => {
    expect(() => validateAnimations([...VALID_ANIMATIONS])).not.toThrow()
  })

  it('normalizes undefined to an empty array', () => {
    expect(normalizeAnimations()).toEqual([])
  })

  it('normalizes all animations in upstream order', () => {
    expect(normalizeAnimations('all')).toEqual(expectedAnimations)
    expect(normalizeAnimations('all')).toHaveLength(98)
  })

  it('deduplicates animations and filters falsy entries', () => {
    expect(normalizeAnimations(['fadeIn', '', 'fadeIn', 'bounce', 'bounce'])).toEqual(['fadeIn', 'bounce'])
  })

  it('suggests the nearest valid name for a typo', () => {
    expect(() => validateAnimations(['fadein']))
      .toThrow(/unknown Quasar animation.*did you mean 'fadeIn'/)
  })

  it('reports all invalid entries at once', () => {
    expect(() => validateAnimations(['Foo', 'Bar'])).toThrow(/Foo.*Bar/)
  })

  it('accepts an empty array', () => {
    expect(() => validateAnimations([])).not.toThrow()
  })

  it('explains the CSS escape hatch for orphan animations', () => {
    expect(() => validateAnimations(['lightSpeedIn']))
      .toThrow(/exists in @quasar\/extras.*css: \['@quasar\/extras\/animate\/lightSpeedIn\.css'\]/)
  })

  it('explains that all must be the string option', () => {
    expect(() => validateAnimations(['all'])).toThrow(/animations: 'all'/)
  })

  it('builds exact animation import specifiers', () => {
    expect(buildAnimationImports(['fadeIn', 'bounce'])).toEqual([
      'import \'@quasar/extras/animate/fadeIn.css\'',
      'import \'@quasar/extras/animate/bounce.css\'',
    ])
  })
})

describe.skipIf(!extrasAvailable)('animations drift guard', () => {
  it('matches upstream animation lists exactly', () => {
    expect(GENERAL_ANIMATIONS).toEqual(animateList?.generalAnimations)
    expect(IN_ANIMATIONS).toEqual(animateList?.inAnimations)
    expect(OUT_ANIMATIONS).toEqual(animateList?.outAnimations)
  })

  it('pins the animation CSS file set and orphan names', async () => {
    const packageJson = await import('@quasar/extras/package.json', { with: { type: 'json' } })
    expect(packageJson.default.name).toBe('@quasar/extras')
    const animateDir = dirname(fileURLToPath(new URL('../node_modules/@quasar/extras/exports/animate/animate-list.js', import.meta.url)))
    const files = await readdir(animateDir)
    const cssNames = files.filter(file => file.endsWith('.css')).map(file => file.slice(0, -4))

    expect(cssNames.filter(name => !(VALID_ANIMATIONS as readonly string[]).includes(name)))
      .toEqual(['lightSpeedIn', 'lightSpeedOut'])
    expect(VALID_ANIMATIONS.filter(name => !cssNames.includes(name))).toEqual([])
  })
})
