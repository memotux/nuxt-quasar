import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { buildImportPresets } from '../src/internal'

const QUASAR_SRC_DIR = dirname(fileURLToPath(new URL('../node_modules/quasar/package.json', import.meta.url)))

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

describe('buildImportPresets curation reconciliation', () => {
  async function upstreamExportNames(entry: string): Promise<string[]> {
    const text = await readFile(join(dirname(QUASAR_SRC_DIR), 'quasar', 'src', `${entry}.js`), 'utf8')
    // Matches both `export { default as X }` and `export { noop, default as Y }`
    // list forms; the alternation must consume the whole `{...}` list so the
    // bare `noop` member is captured too, not just the `as` aliases.
    const names: string[] = []
    for (const [, list] of text.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const member of (list as string).split(',')) {
        const alias = member.match(/\bas\s+([A-Za-z_$][\w$]*)/)
        if (alias?.[1]) names.push(alias[1])
        else {
          const bare = member.trim().match(/^([A-Z_$][\w$]*)$/i)
          if (bare?.[1] && bare[1] !== 'default') names.push(bare[1])
        }
      }
    }
    return names
  }

  it('keeps the composable selection a strict subset of the upstream exports', async () => {
    const upstream = await upstreamExportNames('composables')
    const [composables] = buildImportPresets(QUASAR_SRC)
    const curated = composables!.imports as string[]
    // Every curated composable must still exist upstream: an upstream removal
    // fails here rather than emitting a broken auto-import.
    for (const name of curated) {
      expect(upstream, `curated composable '${name}' is no longer exported by quasar/src/composables.js`).toContain(name)
    }
    // The selection stays curated, not exhaustive: upstream ships more than
    // the three auto-imported composables.
    expect(upstream.length).toBeGreaterThan(curated.length)
  })

  it('keeps the util selection a strict subset of the upstream exports', async () => {
    const upstream = await upstreamExportNames('utils')
    const [, utilsPreset] = buildImportPresets(QUASAR_SRC)
    const curated = (utilsPreset!.imports as [string, string][]).map(([original]) => original)
    for (const name of curated) {
      expect(upstream, `curated util '${name}' is no longer exported by quasar/src/utils.js`).toContain(name)
    }
    expect(upstream.length).toBeGreaterThan(curated.length)
  })
})
