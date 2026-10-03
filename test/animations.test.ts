import { describe, it, expect } from 'vitest'
import {
  GENERAL_ANIMATIONS,
  GENERATED_GENERAL_ANIMATIONS,
  GENERATED_IN_ANIMATIONS,
  GENERATED_ORPHAN_ANIMATIONS,
  GENERATED_OUT_ANIMATIONS,
  VALID_ANIMATIONS,
  buildPluginContents,
  buildAnimationImports,
  normalizeAnimations,
  validateAnimations,
} from '../src/internal'
import {
  IN_ANIMATIONS,
  OUT_ANIMATIONS,
} from '../src/internal/animations'
import { CSS_LINE, DIRECTIVES_LINE, importLines, makeBaseOpts } from './helpers/template-fixtures'

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
  })
})

describe('animations source reconciliation', () => {
  it('routes the curated groups through the generated upstream snapshot', () => {
    expect([...GENERAL_ANIMATIONS]).toEqual([...GENERATED_GENERAL_ANIMATIONS])
    expect([...IN_ANIMATIONS]).toEqual([...GENERATED_IN_ANIMATIONS])
    expect([...OUT_ANIMATIONS]).toEqual([...GENERATED_OUT_ANIMATIONS])
  })

  it('keeps the orphan hint list in sync with the generated orphan inventory', async () => {
    const { KNOWN_ORPHAN_ANIMATIONS } = await import('../src/internal')
    expect([...KNOWN_ORPHAN_ANIMATIONS]).toEqual([...GENERATED_ORPHAN_ANIMATIONS])
    expect(KNOWN_ORPHAN_ANIMATIONS).toContain('lightSpeedIn')
  })

  it('retains the all shorthand that expands to every curated animation', () => {
    // Independent of the group lists above: VALID_ANIMATIONS is the concat of
    // the three groups, so a group-level comparison cannot catch a correlated
    // shrink of all three at once. The tripwire below derives the expected
    // count from the generated snapshot — the source of the groups — so a
    // correlated drift between generated and curated lists still fails.
    const expected = GENERATED_GENERAL_ANIMATIONS.length
      + GENERATED_IN_ANIMATIONS.length + GENERATED_OUT_ANIMATIONS.length
    expect(normalizeAnimations('all')).toHaveLength(expected)
    expect(expected).toBeGreaterThan(0)
  })
})

describe('animations validation', () => {
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
  it('matches the generated upstream snapshot groups exactly', () => {
    // The generated module is itself pinned against the installed packages by
    // test/generate-quasar-lists.test.ts, so this guard only reconciles the
    // curated groups with that shared source — no direct upstream reads here.
    expect([...GENERAL_ANIMATIONS]).toEqual([...GENERATED_GENERAL_ANIMATIONS])
    expect([...IN_ANIMATIONS]).toEqual([...GENERATED_IN_ANIMATIONS])
    expect([...OUT_ANIMATIONS]).toEqual([...GENERATED_OUT_ANIMATIONS])
  })

  it('keeps the orphan names in sync with the generated orphan inventory', () => {
    // `lightSpeedIn`/`lightSpeedOut` were previously pinned as a literal here;
    // they now reconcile against the generated inventory, whose own content
    // is pinned against the installed css files by the generator tests.
    expect([...GENERATED_ORPHAN_ANIMATIONS].sort()).toEqual(['lightSpeedIn', 'lightSpeedOut'])
  })
})

describe('animations \'all\' composed path', () => {
  // module.ts runs exactly this composition: normalizeAnimations(opts.animations)
  // then validateAnimations(normalized) then buildPluginContents({ animations }).
  // The shorthand is therefore validated in its EXPANDED array form, and the
  // template receives every curated animation, not the string 'all'.
  it('normalizes the all shorthand into a selection that passes validation', () => {
    const normalized = normalizeAnimations('all')

    expect(normalized).toHaveLength(
      GENERATED_GENERAL_ANIMATIONS.length + GENERATED_IN_ANIMATIONS.length + GENERATED_OUT_ANIMATIONS.length,
    )
    expect(() => validateAnimations(normalized)).not.toThrow()
  })

  it('emits one CSS import per animation as one contiguous group in the documented position', () => {
    const normalized = normalizeAnimations('all')
    const contents = buildPluginContents({ ...makeBaseOpts(), animations: normalized })
    const animationLines = buildAnimationImports(normalized)

    expect(animationLines).toHaveLength(normalized.length)
    expect(animationLines[0]).toBe('import \'@quasar/extras/animate/bounce.css\'')
    expect(animationLines.at(-1)).toBe('import \'@quasar/extras/animate/zoomOutUp.css\'')

    // Asserting the whole sequence (not a count) proves every line is
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
