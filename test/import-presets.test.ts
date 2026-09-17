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
