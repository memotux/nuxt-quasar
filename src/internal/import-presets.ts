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
 * Composables: useQuasar, useDialogPluginComponent, useFormChild
 * Utils: 22 aliased pairs (e.g. ['clone', 'qclone'])
 */
export function buildImportPresets(quasarSrc: string): ImportPreset[] {
  return [
    {
      from: quasarSrc + 'composables',
      imports: [
        'useQuasar',
        'useDialogPluginComponent',
        'useFormChild',
      ],
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
