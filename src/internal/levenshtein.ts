/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * Single-row dynamic programming: `O(a.length * b.length)` time,
 * `O(b.length)` space. Used to power the `did you mean ...?` hints
 * emitted by the animation and icon-library validators.
 */
export function levenshteinDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]!
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = row[j]!
      row[j] = a[i - 1] === b[j - 1]
        ? diagonal
        : Math.min(diagonal + 1, row[j]! + 1, row[j - 1]! + 1)
      diagonal = above
    }
  }
  return row[b.length]!
}
