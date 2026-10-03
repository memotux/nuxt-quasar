#!/usr/bin/env node
/**
 * Deterministic generator for the installed-package name snapshot in
 * `src/internal/generated-quasar-lists.ts`.
 *
 * Sources (installed repository packages only, never the network):
 * - animations: `@quasar/extras` `exports/animate/animate-list.js` groups plus
 *   `.css` files present without a group entry (orphans).
 * - icon sets: every `*.js` file under `quasar/icon-set/` (policy exclusions
 *   such as Font Awesome Pro stay in handwritten `src/internal/icon-set.ts`).
 * - icon libraries: every `@quasar/extras` export dir bundling a same-named
 *   `<name>/<name>.css` file (font/SVG-only filtering stays handwritten).
 * - languages: modern names from `quasar/lang/index.json`; alias files are the
 *   `quasar/lang/*.js` files absent from that index (deprecation semantics
 *   stay in handwritten `src/internal/lang.ts`).
 * - plugins: every `quasar/dist/api/*.json` entry with `type: 'plugin'`
 *   (curated `VALID_PLUGINS` stays handwritten in `src/internal/plugins.ts`).
 *
 * Usage: `node scripts/generate-quasar-lists.mjs [--check]`.
 * `--check` exits non-zero on stale generated output without writing it.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const QUASAR_DIR = join(REPO_ROOT, 'node_modules', 'quasar')
const EXTRAS_DIR = join(REPO_ROOT, 'node_modules', '@quasar', 'extras')
const OUTPUT_FILE = join(REPO_ROOT, 'src', 'internal', 'generated-quasar-lists.ts')

function formatList(values) {
  if (values.length === 0) return '[]'
  return `[\n${values.map(value => `  '${value}',`).join('\n')}\n]`
}

function formatBlock(comment, name, values) {
  return `/** ${comment} */\nexport const ${name} = ${formatList(values)} as const`
}

async function readJsonFile(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function collectAnimations() {
  const animateList = await import(
    pathToFileURL(join(EXTRAS_DIR, 'exports', 'animate', 'animate-list.js')).href
  )
  const general = [...animateList.generalAnimations]
  const inGroup = [...animateList.inAnimations]
  const outGroup = [...animateList.outAnimations]
  const listed = new Set([...general, ...inGroup, ...outGroup])
  const cssNames = (await readdir(join(EXTRAS_DIR, 'exports', 'animate')))
    .filter(name => name.endsWith('.css'))
    .map(name => name.slice(0, -'.css'.length))
  const orphans = cssNames.filter(name => !listed.has(name)).sort()
  return { general, inGroup, outGroup, orphans }
}

async function collectIconSetsShipped() {
  return (await readdir(join(QUASAR_DIR, 'icon-set')))
    .filter(name => name.endsWith('.js'))
    .map(name => name.slice(0, -'.js'.length))
    .sort()
}

async function collectIconLibrariesShipped() {
  const entries = await readdir(join(EXTRAS_DIR, 'exports'), { withFileTypes: true })
  const shipped = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'animate') continue
    try {
      await readFile(join(EXTRAS_DIR, 'exports', entry.name, `${entry.name}.css`))
      shipped.push(entry.name)
    }
    catch {
      // No same-named css bundle in this export dir: not an icon library.
    }
  }
  return shipped.sort()
}

async function collectLangs() {
  const index = await readJsonFile(join(QUASAR_DIR, 'lang', 'index.json'))
  const modern = index.map(entry => entry.isoName).sort()
  const modernSet = new Set(modern)
  const files = (await readdir(join(QUASAR_DIR, 'lang')))
    .filter(name => name.endsWith('.js'))
    .map(name => name.slice(0, -'.js'.length))
  return { modern, aliases: files.filter(name => !modernSet.has(name)).sort() }
}

async function collectQuasarPlugins() {
  const apiDir = join(QUASAR_DIR, 'dist', 'api')
  const files = (await readdir(apiDir)).filter(name => name.endsWith('.json'))
  const plugins = []
  for (const file of files) {
    const api = await readJsonFile(join(apiDir, file))
    if (api.type === 'plugin') plugins.push(file.slice(0, -'.json'.length))
  }
  return plugins.sort()
}

async function buildOutput() {
  const { general, inGroup, outGroup, orphans } = await collectAnimations()
  const iconSets = await collectIconSetsShipped()
  const iconLibraries = await collectIconLibrariesShipped()
  const { modern, aliases } = await collectLangs()
  const plugins = await collectQuasarPlugins()
  const quasarPkg = await readJsonFile(join(QUASAR_DIR, 'package.json'))
  const extrasPkg = await readJsonFile(join(EXTRAS_DIR, 'package.json'))

  const blocks = [
    formatBlock('General animations from @quasar/extras animate-list.js.', 'GENERATED_GENERAL_ANIMATIONS', general),
    formatBlock('In animations from @quasar/extras animate-list.js.', 'GENERATED_IN_ANIMATIONS', inGroup),
    formatBlock('Out animations from @quasar/extras animate-list.js.', 'GENERATED_OUT_ANIMATIONS', outGroup),
    formatBlock('Animate css files with no animate-list.js group entry.', 'GENERATED_ORPHAN_ANIMATIONS', orphans),
    formatBlock('Every quasar/icon-set/*.js mapping, including policy-excluded variants.', 'GENERATED_ICON_SETS_SHIPPED', iconSets),
    formatBlock('Every @quasar/extras export dir bundling a same-named css file.', 'GENERATED_ICON_LIBRARIES_SHIPPED', iconLibraries),
    formatBlock('Modern language packs from quasar/lang/index.json.', 'GENERATED_LANG_MODERN', modern),
    formatBlock('quasar/lang/*.js files absent from index.json (deprecated aliases).', 'GENERATED_LANG_ALIAS_FILES', aliases),
    formatBlock('Every quasar/dist/api entry with type plugin.', 'GENERATED_QUASAR_PLUGINS', plugins),
  ]

  return `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Snapshot of the names shipped by the quasar@${quasarPkg.version} and
 * @quasar/extras@${extrasPkg.version} packages installed in this repository.
 * Regenerate with: \`node scripts/generate-quasar-lists.mjs\`.
 *
 * Derived data only. Project policy (Pro exclusions, deprecated language
 * aliases, 'all' semantics) and curated sets (the supported plugin list,
 * the utility/composable import selection) stay in the handwritten
 * \`src/internal/*.ts\` modules and are never edited by the generator.
 */
${blocks.join('\n\n')}

export const GENERATED_QUASAR_VERSION = '${quasarPkg.version}' as const

export const GENERATED_QUASAR_EXTRAS_VERSION = '${extrasPkg.version}' as const
`
}

async function main() {
  const check = process.argv.includes('--check')
  const output = await buildOutput()
  if (check) {
    const current = await readFile(OUTPUT_FILE, 'utf8')
    if (current !== output) {
      console.error(`stale generated snapshot: ${OUTPUT_FILE} differs from generator output; run \`node scripts/generate-quasar-lists.mjs\` to regenerate`)
      process.exitCode = 1
      return
    }
    console.log('generated snapshot is fresh')
    return
  }
  await writeFile(OUTPUT_FILE, output, 'utf8')
  console.log(`wrote ${OUTPUT_FILE}`)
}

await main()
