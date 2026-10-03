import { describe, it, expect } from 'vitest'
import { requiredExtrasOptions, VALID_ICON_SETS, extrasRequirementMessage } from '../src/internal'

/**
 * Truth table for `requiredExtrasOptions`. The stable order
 * `animations`, `iconLibraries`, `iconSet` is load-bearing: the module's
 * error message joins the names with `' or '`, so the order is observable.
 */
describe('requiredExtrasOptions', () => {
  // Row 1 — all empty / `iconSet` omitted contributes nothing.
  it('returns [] when animations and iconLibraries are empty and iconSet is omitted', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [] })).toEqual([])
  })

  // Row 2 — a non-empty `animations` list requires @quasar/extras.
  it('returns [\'animations\'] for a non-empty animations list', () => {
    expect(requiredExtrasOptions({ animations: ['fadeIn'], iconLibraries: [] })).toEqual(['animations'])
  })

  // Row 3 — a non-empty `iconLibraries` list requires @quasar/extras.
  it('returns [\'iconLibraries\'] for a non-empty iconLibraries list', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: ['material-icons'] })).toEqual(['iconLibraries'])
  })

  // Row 4 — an svg icon set requires @quasar/extras.
  it('returns [\'iconSet\'] for an svg icon set', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [], iconSet: 'svg-material-icons' })).toEqual(['iconSet'])
  })

  // Row 5 — a webfont icon set does NOT require @quasar/extras.
  it('returns [] for the material-icons webfont icon set', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [], iconSet: 'material-icons' })).toEqual([])
  })

  // Row 6 — a second svg icon set, to avoid pinning the split on one name.
  it('returns [\'iconSet\'] for svg-mdi-v7', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [], iconSet: 'svg-mdi-v7' })).toEqual(['iconSet'])
  })

  // Row 7 — a webfont Font Awesome set does NOT require @quasar/extras.
  it('returns [] for the fontawesome-v7 webfont icon set', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [], iconSet: 'fontawesome-v7' })).toEqual([])
  })

  // Row 8 — `isSvgIconSet` also requires membership in `VALID_ICON_SETS`, so a
  // bogus `svg-` name contributes nothing. In production the module validates
  // the name first and rejects it before this helper is reached.
  it('returns [] for a bogus svg- name that is not a valid icon set', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [], iconSet: 'svg-not-a-real-set' })).toEqual([])
  })

  // Row 9 — pins the STABLE ORDER the error message depends on.
  it('returns [\'animations\', \'iconLibraries\', \'iconSet\'] when all three require @quasar/extras', () => {
    expect(requiredExtrasOptions({
      animations: ['fadeIn'],
      iconLibraries: ['material-icons'],
      iconSet: 'svg-mdi-v7',
    })).toEqual(['animations', 'iconLibraries', 'iconSet'])
  })

  // Row 10 — exhaustive property over the shipped list: every valid icon set
  // contributes exactly when its name starts with `svg-`. The oracle is
  // deliberately INDEPENDENT of `isSvgIconSet`: it uses the raw `svg-` prefix,
  // so this property can actually FAIL if that predicate regresses (e.g.
  // returns false for every svg name). Asserting against `isSvgIconSet(name)`
  // here would reduce to `isSvgIconSet(name) === isSvgIconSet(name)` and stay
  // green under exactly that regression.
  it.each(VALID_ICON_SETS)('requiredExtrasOptions requires exactly the svg-* sets: %s', (name) => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [], iconSet: name }).length)
      .toBe(name.startsWith('svg-') ? 1 : 0)
  })

  // The exhaustive property above makes the split total; this pins the split
  // itself using the same independent prefix criterion (not the predicate):
  // the svg/webfont partition covers the curated list with no overlap and no
  // volatile upstream counts.
  it('partitions VALID_ICON_SETS into svg-* and webfont names with no overlap', () => {
    const svgCount = VALID_ICON_SETS.filter(name => name.startsWith('svg-')).length
    const webfontCount = VALID_ICON_SETS.filter(name => !name.startsWith('svg-')).length
    expect(svgCount).toBeGreaterThan(0)
    expect(webfontCount).toBeGreaterThan(0)
    expect(svgCount + webfontCount).toBe(VALID_ICON_SETS.length)
  })

  // Row 11 — the production path: `normalizeAnimations` always returns an
  // array (see src/module.ts), so an explicit empty array must contribute
  // nothing (not the same as `undefined`).
  it('returns [] when animations is an explicit empty array', () => {
    expect(requiredExtrasOptions({ animations: [], iconLibraries: [], iconSet: undefined })).toEqual([])
  })

  // Triangulation — the stable order must hold for partial subsets too, not
  // only when all three are present, otherwise the joined message would
  // reorder as soon as `animations` is absent.
  it('keeps the stable order for a partial subset: [\'iconLibraries\', \'iconSet\']', () => {
    expect(requiredExtrasOptions({
      animations: [],
      iconLibraries: ['material-icons'],
      iconSet: 'svg-mdi-v7',
    })).toEqual(['iconLibraries', 'iconSet'])
  })
})

/**
 * The guard's user-facing message — the only output a consumer ever sees from
 * it. Exact `toBe` equality against the literal string so any wording, spacing
 * or join change is caught; `toContain` would miss all of those.
 */
describe('extrasRequirementMessage', () => {
  it('renders the full message for a single option', () => {
    expect(extrasRequirementMessage(['animations'])).toBe(
      'nuxt-quasar-vite: using animations requires the @quasar/extras package. '
      + 'Install it with: pnpm add -D @quasar/extras',
    )
  })

  // Pins the `' or '` join, which was previously untested.
  it('joins two options with \' or \'', () => {
    expect(extrasRequirementMessage(['animations', 'iconLibraries'])).toBe(
      'nuxt-quasar-vite: using animations or iconLibraries requires the @quasar/extras package. '
      + 'Install it with: pnpm add -D @quasar/extras',
    )
  })

  it('joins three options with \' or \'', () => {
    expect(extrasRequirementMessage(['animations', 'iconLibraries', 'iconSet'])).toBe(
      'nuxt-quasar-vite: using animations or iconLibraries or iconSet requires the @quasar/extras package. '
      + 'Install it with: pnpm add -D @quasar/extras',
    )
  })
})
