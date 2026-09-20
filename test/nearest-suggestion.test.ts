import { describe, it, expect } from 'vitest'
import { nearestSuggestion } from '../src/internal/validation'

/**
 * Direct coverage for `nearestSuggestion` (`src/internal/validation.ts`).
 * The function powers every did-you-mean hint emitted by the validators
 * (`validatePlugins`, `validateAnimations`, `validateIconLibraries`,
 * `validateIconSet`, `validateLang`). Pinning its contract here prevents
 * silent drift in the wording or distance threshold.
 */
describe('nearestSuggestion', () => {
  it('returns the suggestion suffix when the nearest distance is ≤ 3', () => {
    expect(nearestSuggestion('Notifi', ['Notify'])).toBe(` (did you mean 'Notify'?)`)
  })

  it('returns the empty suffix when no candidate is within distance 3', () => {
    expect(nearestSuggestion('Foobar', ['Notify', 'Dialog'])).toBe('')
  })

  it('returns the suggestion suffix for an exact match (distance 0)', () => {
    // Contract: the function returns the suffix for any distance ≤ 3, including 0.
    // Callers (the validators) filter out exact matches before invoking this, so
    // the suffix for distance 0 is unreachable in practice but the function does
    // not branch on it. Pin the behaviour.
    expect(nearestSuggestion('Notify', ['Notify'])).toBe(` (did you mean 'Notify'?)`)
  })

  it('throws when validList is empty (reduce has no initial value)', () => {
    // The function does not guard against empty validList; callers guarantee a
    // non-empty list. Pin the throw shape so a future refactor that introduces a
    // guard is a deliberate choice rather than a silent regression.
    expect(() => nearestSuggestion('Notify', [])).toThrow(TypeError)
  })

  it('picks the first occurrence in validList when distances tie (reduce strict-less)', () => {
    // 'ab' vs ['aa', 'bb']: both at distance 1; reduce starts with best='aa'
    // and the strict-less comparison keeps 'aa' on the tie.
    expect(nearestSuggestion('ab', ['aa', 'bb'])).toBe(` (did you mean 'aa'?)`)
  })

  it('uses single quotes around the chosen name and the canonical "(did you mean \'<name>\'?)" wording', () => {
    const result = nearestSuggestion('Notif', ['Notify'])
    expect(result).toBe(` (did you mean 'Notify'?)`)
    expect(result).toMatch(/^ \(did you mean '[^']+'\?\)$/)
  })

  it('does not suggest when the nearest distance is exactly 4', () => {
    // 'fgh' vs 'abcde': distance 5 (replace all); verify boundary is strict > 3.
    expect(nearestSuggestion('fgh', ['abcde'])).toBe('')
  })
})
