import { parseQuasarExportNames } from './quasar-exports'

/**
 * Curated QAS-1 first wave (Quasar 2.34+). Kept as a literal tuple so the
 * curation stays explicit and auditable — never derived from upstream.
 * Module-private: the `internal-barrel` drift guard pins the exact runtime
 * export list, and this curation is only consumed via `buildImportPresets`.
 */
const FIRST_WAVE_COMPOSABLES = [
  'useFilePicker',
  'useSoftFullscreen',
  'useKeyboardShortcut',
] as const

/**
 * Resolve which first-wave composables the consumer's Quasar source
 * exports, in curated order. Fails loudly on an empty/malformed surface
 * (via `parseQuasarExportNames`) so older Quasar versions get the
 * exact 2.27 baseline and newer ones get exactly the exported subset.
 */
function resolveFirstWaveComposables(source: string): string[] {
  const exported = new Set(parseQuasarExportNames(
    source,
    'the resolved quasar/src/composables.js; '
    + 'version-aware composable auto-imports cannot be determined',
  ))
  return FIRST_WAVE_COMPOSABLES.filter(name => exported.has(name))
}

export interface ImportPreset {
  from: string
  imports: Array<string | [string, string]>
}

/**
 * Build the auto-import presets for Quasar composables and utilities.
 *
 * Curated selection, not the full upstream export surface: Quasar ships
 * more composables (`useMeta`, `useInterval`, `useTimeout`, ...) and more
 * utils (`EventBus`, `is`, `runSequentialPromises`, ...) than this module
 * auto-imports, and generation must not expand the public set. The curated
 * lists below are guarded by the reconciliation checks in
 * `test/import-presets.test.ts`, which fail loudly — rather than silently
 * widening the set — when upstream adds or removes names.
 *
 * Composables baseline (Quasar 2.27): useQuasar, useDialogPluginComponent,
 * useFormChild. First wave (Quasar 2.34+): useFilePicker, useSoftFullscreen,
 * useKeyboardShortcut — included only when the consumer's resolved Quasar
 * source exports them. Utils: 22 aliased pairs (e.g. ['clone', 'qclone'])
 *
 * @param quasarSrc Resolved consumer Quasar `src/` base (e.g. `.../quasar/src/`).
 * @param composablesSource Optional text of the consumer's resolved
 * `quasar/src/composables.js`. When omitted, exactly the 2.27 baseline is
 * returned. When provided, the first wave is gated on the parsed export
 * names; an empty export surface throws instead of silently claiming support.
 */
export function buildImportPresets(quasarSrc: string, composablesSource?: string): ImportPreset[] {
  const baseline = [
    'useQuasar',
    'useDialogPluginComponent',
    'useFormChild',
  ]
  const composables = composablesSource === undefined
    ? baseline
    : [...baseline, ...resolveFirstWaveComposables(composablesSource)]
  return [
    {
      from: quasarSrc + 'composables',
      imports: composables,
    },
    {
      from: quasarSrc + 'utils',
      imports: [
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
      ],
    },
  ]
}
