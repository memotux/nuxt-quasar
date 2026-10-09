/**
 * Shared parser for `quasar/src/*.js`-shaped export surfaces (composables,
 * plugins, ...). Matches both single-line re-exports
 * (`export { default as X } from '...'`) and multi-line `export { ... }`
 * list forms; the line-start `export` anchor means `import { ... }`
 * statements never match. Throws a `nuxt-quasar-vite`-prefixed error naming
 * the given source label when no export names are found, so a malformed or
 * unreadable consumer surface fails loudly instead of silently claiming (or
 * denying) support for version-gated APIs.
 *
 * The `sourceLabel` carries the human-readable origin (and, where needed,
 * the consequence, e.g. which version-aware feature cannot be determined);
 * it is interpolated verbatim into the failure message.
 */
export function parseQuasarExportNames(source: string, sourceLabel: string): string[] {
  const names: string[] = []
  for (const [, list] of source.matchAll(/(?:^|\n)\s*export\s*\{([^}]*)\}/g)) {
    const code = (list as string)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/'[^']*'/g, '')
      .replace(/"[^"]*"/g, '')
    for (const member of code.split(',')) {
      const stripped = member.split('//')[0] ?? ''
      const alias = stripped.match(/\bas\s+([a-z_$][\w$]*)/i)
      if (alias?.[1] && alias[1] !== 'default') {
        names.push(alias[1])
        continue
      }
      const bare = stripped.trim().match(/^([a-z_$][\w$]*)$/i)
      if (bare?.[1] && bare[1] !== 'default') names.push(bare[1])
    }
  }
  if (names.length === 0) {
    throw new Error(
      `nuxt-quasar-vite: could not parse any export names from ${sourceLabel}. `
      + 'Check that the installed Quasar package is intact.',
    )
  }
  return names
}
