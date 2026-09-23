import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  VALID_ANIMATIONS,
  buildPluginContents,
  buildAnimationImports,
  normalizeAnimations,
  validateAnimations,
} from '../src/internal'
import {
  GENERAL_ANIMATIONS,
  IN_ANIMATIONS,
  OUT_ANIMATIONS,
} from '../src/internal/animations'
import { CSS_LINE, DIRECTIVES_LINE, importLines, makeBaseOpts } from './helpers/template-fixtures'
import { loadUpstreamModule, readShippedDir } from './helpers/drift'

const expectedAnimations = [...GENERAL_ANIMATIONS, ...IN_ANIMATIONS, ...OUT_ANIMATIONS]

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
    // 98 is an INDEPENDENT tripwire and must stay a literal. VALID_ANIMATIONS is
    // the concat of GENERAL/IN/OUT, so toEqual(expectedAnimations) above compares
    // the curated lists against themselves and cannot detect a correlated shrink
    // of all three at once. Deriving 98 from any of them would make this
    // assertion tautological for the same reason.
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

describe('animations drift guard', () => {
  it('matches upstream animation lists exactly', async () => {
    const animateList = await loadUpstreamModule<{
      generalAnimations: string[]
      inAnimations: string[]
      outAnimations: string[]
    }>('@quasar/extras/animate/animate-list.common', '@quasar/extras')

    expect(GENERAL_ANIMATIONS).toEqual(animateList.generalAnimations)
    expect(IN_ANIMATIONS).toEqual(animateList.inAnimations)
    expect(OUT_ANIMATIONS).toEqual(animateList.outAnimations)
  })

  it('pins the animation CSS file set and orphan names', async () => {
    const packageJson = await loadUpstreamModule<{ default: { name: string } }>(
      '@quasar/extras/package.json',
      '@quasar/extras',
      { with: { type: 'json' } },
    )
    expect(packageJson.default.name).toBe('@quasar/extras')
    const animateDir = dirname(fileURLToPath(new URL('../node_modules/@quasar/extras/exports/animate/animate-list.js', import.meta.url)))
    const files = await readShippedDir(animateDir)
    const cssNames = files.filter(file => file.endsWith('.css')).map(file => file.slice(0, -4))

    expect(cssNames.filter(name => !(VALID_ANIMATIONS as readonly string[]).includes(name)))
      .toEqual(['lightSpeedIn', 'lightSpeedOut'])
    expect(VALID_ANIMATIONS.filter(name => !cssNames.includes(name))).toEqual([])
  })
})

describe('animations \'all\' composed path', () => {
  // module.ts runs exactly this composition: normalizeAnimations(opts.animations)
  // then validateAnimations(normalized) then buildPluginContents({ animations }).
  // The shorthand is therefore validated in its EXPANDED array form, and the
  // template receives 98 names, not the string 'all'.
  it('normalizes the all shorthand into a selection that passes validation', () => {
    const normalized = normalizeAnimations('all')

    expect(normalized).toHaveLength(98)
    expect(() => validateAnimations(normalized)).not.toThrow()
  })

  it('emits one CSS import per animation as one contiguous group in the documented position', () => {
    const normalized = normalizeAnimations('all')
    const contents = buildPluginContents({ ...makeBaseOpts(), animations: normalized })
    const animationLines = buildAnimationImports(normalized)

    expect(animationLines).toHaveLength(98)
    expect(animationLines[0]).toBe('import \'@quasar/extras/animate/bounce.css\'')
    expect(animationLines.at(-1)).toBe('import \'@quasar/extras/animate/zoomOutUp.css\'')

    // Asserting the whole sequence (not a count) proves the 98 lines are
    // contiguous and that no line was displaced out of the group.
    expect(importLines(contents)).toEqual([
      'import type { Plugin } from \'vue\'',
      'import { defineNuxtPlugin, onNuxtReady } from \'#app\'',
      'import installQ from \'quasar/src/install-quasar.js\'',
      'import { Notify } from \'quasar/src/plugins.js\'',
      DIRECTIVES_LINE,
      ...animationLines,
      CSS_LINE,
    ])
  })
})
