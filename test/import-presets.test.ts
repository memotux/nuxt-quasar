import { describe, it, expect } from 'vitest'
import { buildImportPresets } from '../src/internal'

const QUASAR_SRC = '/node_modules/quasar/src/'

describe('buildImportPresets (F4: imports:sources hook)', () => {
  it('returns exactly 2 presets (composables + utils)', () => {
    const presets = buildImportPresets(QUASAR_SRC)
    expect(presets).toHaveLength(2)
  })

  describe('composables preset', () => {
    it('has correct from path', () => {
      const [composables] = buildImportPresets(QUASAR_SRC)
      expect(composables!.from).toBe(QUASAR_SRC + 'composables')
    })

    it('has exactly 3 composable imports', () => {
      const [composables] = buildImportPresets(QUASAR_SRC)
      expect(composables!.imports).toHaveLength(3)
    })

    it('imports useQuasar, useDialogPluginComponent, useFormChild', () => {
      const [composables] = buildImportPresets(QUASAR_SRC)
      expect(composables!.imports).toEqual([
        'useQuasar',
        'useDialogPluginComponent',
        'useFormChild',
      ])
    })
  })

  describe('utils preset', () => {
    it('has correct from path', () => {
      const [, utils] = buildImportPresets(QUASAR_SRC)
      expect(utils!.from).toBe(QUASAR_SRC + 'utils')
    })

    it('has exactly 22 aliased import pairs', () => {
      const [, utils] = buildImportPresets(QUASAR_SRC)
      expect(utils!.imports).toHaveLength(22)
    })

    it('all imports are aliased tuples [original, q-prefixed]', () => {
      const [, utils] = buildImportPresets(QUASAR_SRC)
      for (const imp of utils!.imports) {
        expect(Array.isArray(imp)).toBe(true)
        const [original, alias] = imp as [string, string]
        expect(alias).toBe('q' + original)
      }
    })

    it('contains expected utility names', () => {
      const [, utilsPreset] = buildImportPresets(QUASAR_SRC)
      const utils = utilsPreset!.imports as [string, string][]
      const originals = utils.map(([name]) => name)

      expect(originals).toContain('clone')
      expect(originals).toContain('colors')
      expect(originals).toContain('copyToClipboard')
      expect(originals).toContain('date')
      expect(originals).toContain('debounce')
      expect(originals).toContain('dom')
      expect(originals).toContain('event')
      expect(originals).toContain('exportFile')
      expect(originals).toContain('extend')
      expect(originals).toContain('format')
      expect(originals).toContain('frameDebounce')
      expect(originals).toContain('getCssVar')
      expect(originals).toContain('noop')
      expect(originals).toContain('morph')
      expect(originals).toContain('openURL')
      expect(originals).toContain('patterns')
      expect(originals).toContain('scroll')
      expect(originals).toContain('setCssVar')
      expect(originals).toContain('throttle')
      expect(originals).toContain('uid')
      expect(originals).toContain('createMetaMixin')
      expect(originals).toContain('createUploaderComponent')
    })

    it('aliases are all q-prefixed originals', () => {
      const [, utilsPreset] = buildImportPresets(QUASAR_SRC)
      const utils = utilsPreset!.imports as [string, string][]
      expect(utils).toEqual([
        ['clone', 'qclone'],
        ['colors', 'qcolors'],
        ['copyToClipboard', 'qcopyToClipboard'],
        ['createMetaMixin', 'qcreateMetaMixin'],
        ['createUploaderComponent', 'qcreateUploaderComponent'],
        ['date', 'qdate'],
        ['debounce', 'qdebounce'],
        ['dom', 'qdom'],
        ['event', 'qevent'],
        ['exportFile', 'qexportFile'],
        ['extend', 'qextend'],
        ['format', 'qformat'],
        ['frameDebounce', 'qframeDebounce'],
        ['getCssVar', 'qgetCssVar'],
        ['noop', 'qnoop'],
        ['morph', 'qmorph'],
        ['openURL', 'qopenURL'],
        ['patterns', 'qpatterns'],
        ['scroll', 'qscroll'],
        ['setCssVar', 'qsetCssVar'],
        ['throttle', 'qthrottle'],
        ['uid', 'quid'],
      ])
    })
  })

  it('uses the provided quasarSrc path as base', () => {
    const [composables, utils] = buildImportPresets('/custom/path/to/quasar/src/')
    expect(composables!.from).toBe('/custom/path/to/quasar/src/composables')
    expect(utils!.from).toBe('/custom/path/to/quasar/src/utils')
  })
})
