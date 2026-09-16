import { describe, it, expect } from 'vitest'
import { levenshteinDistance } from '../src/internal/levenshtein'

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('fadeIn', 'fadeIn')).toBe(0)
    expect(levenshteinDistance('', '')).toBe(0)
  })

  it('returns 1 for a single-character substitution', () => {
    expect(levenshteinDistance('fadein', 'fadeIn')).toBe(1)
    expect(levenshteinDistance('material-icon', 'material-icons')).toBe(1)
  })

  it('returns 1 for a single-character insertion or deletion', () => {
    expect(levenshteinDistance('mdi-v7', 'mdi-v77')).toBe(1)
    expect(levenshteinDistance('themify', 'themif')).toBe(1)
  })

  it('measures the full edit distance for unrelated strings', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
    expect(levenshteinDistance('', 'abc')).toBe(3)
  })

  it('reports a distance greater than 3 for far-off names', () => {
    expect(levenshteinDistance('bootstrap-icons', 'zzzz')).toBeGreaterThan(3)
  })

  it('is symmetric', () => {
    expect(levenshteinDistance('eva-icons', 'ionicons-v4'))
      .toBe(levenshteinDistance('ionicons-v4', 'eva-icons'))
  })
})
