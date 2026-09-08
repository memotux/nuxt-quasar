import { describe, it, expect } from 'vitest'
import { mergeSassOptions, mergeScssOptions } from '../src/internal'

const moduleDefaults = {
  additionalData: 'moduleData',
  silenceDeprecations: ['import'],
}

describe('merge preprocessor options', () => {
  it('uses module defaults when user options are missing', () => {
    expect(mergeScssOptions(moduleDefaults)).toEqual(moduleDefaults)
    expect(mergeSassOptions(moduleDefaults)).toEqual(moduleDefaults)
  })

  it('prepends user additionalData for scss and sass', () => {
    expect(mergeScssOptions(moduleDefaults, { additionalData: 'userData' }).additionalData)
      .toBe('moduleData;\nuserData')
    expect(mergeSassOptions(moduleDefaults, { additionalData: 'userData' }).additionalData)
      .toBe('moduleData\nuserData')
  })

  it('unions and deduplicates user silenceDeprecations', () => {
    expect(mergeScssOptions(moduleDefaults, {
      silenceDeprecations: ['import', 'legacy-js-api'],
    }).silenceDeprecations).toEqual(['import', 'legacy-js-api'])
  })

  it('preserves the api option', () => {
    expect(mergeScssOptions(moduleDefaults, { api: 'modern-compiler' }).api)
      .toBe('modern-compiler')
  })

  it('preserves importers', () => {
    const importers = [{ findFileUrl: () => new URL('file:///styles.scss') }]
    expect(mergeScssOptions(moduleDefaults, { importers }).importers).toBe(importers)
  })

  it('preserves unknown fields', () => {
    expect(mergeScssOptions(moduleDefaults, { customThing: 42 }).customThing).toBe(42)
  })

  it('keeps module defaults first when another module set deprecations', () => {
    expect(mergeScssOptions(moduleDefaults, {
      silenceDeprecations: ['legacy-js-api'],
    }).silenceDeprecations).toEqual(['import', 'legacy-js-api'])
  })

  it('uses the appropriate additionalData joiner', () => {
    expect(mergeScssOptions(moduleDefaults, { additionalData: 'userData' }).additionalData)
      .toBe('moduleData;\nuserData')
    expect(mergeSassOptions(moduleDefaults, { additionalData: 'userData' }).additionalData)
      .toBe('moduleData\nuserData')
  })

  it('preserves an explicitly empty additionalData value', () => {
    expect(mergeScssOptions(moduleDefaults, { additionalData: '' }).additionalData).toBe('')
    expect(mergeSassOptions(moduleDefaults, { additionalData: '' }).additionalData).toBe('')
  })

  it('applies module defaults when user silenceDeprecations is empty', () => {
    expect(mergeScssOptions(moduleDefaults, { silenceDeprecations: [] }).silenceDeprecations)
      .toEqual(['import'])
  })

  it('merges both special fields and preserves unrelated fields', () => {
    const result = mergeScssOptions(moduleDefaults, {
      additionalData: 'userData',
      silenceDeprecations: ['legacy-js-api'],
      customThing: 42,
    })

    expect(result).toEqual({
      additionalData: 'moduleData;\nuserData',
      silenceDeprecations: ['import', 'legacy-js-api'],
      customThing: 42,
    })
  })

  it('is idempotent', () => {
    const once = mergeScssOptions(moduleDefaults, { additionalData: 'userData' })
    expect(mergeScssOptions(moduleDefaults, once)).toEqual(once)
  })
})
