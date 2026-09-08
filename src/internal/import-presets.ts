export interface ImportPreset {
  from: string
  imports: Array<string | [string, string]>
}

/**
 * Build the auto-import presets for Quasar composables and utilities.
 *
 * Composables: useQuasar, useDialogPluginComponent, useFormChild
 * Utils: 21 aliased pairs (e.g. ['clone', 'qclone'])
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
