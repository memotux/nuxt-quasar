/**
 * Build the Sass/SCSS `additionalData` import lines for Quasar CSS variables.
 *
 * - `false` → empty array (no imports injected)
 * - `true`  → single `@import 'quasar/src/css/variables.sass'`
 * - `string` → custom path prepended before the Quasar variables import
 *
 * The returned array is joined with `;\n` (SCSS) or `\n` (Sass) by the caller
 * and includes a trailing empty string so the join produces a trailing newline.
 */
export function buildSassImportCode(sassVariables: string | boolean): string[] {
  if (!sassVariables) {
    return []
  }

  const lines = [`@import 'quasar/src/css/variables.sass'`, '']

  if (typeof sassVariables === 'string') {
    lines.unshift(`@import '${sassVariables}'`)
  }

  return lines
}
