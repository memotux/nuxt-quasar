import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import * as Generated from '../src/internal/generated-quasar-lists'
import { VALID_ICON_SETS } from '../src/internal/icon-set'
import { VALID_ICON_LIBRARIES } from '../src/internal/icon-libraries'
import { VALID_LANG } from '../src/internal/lang'
import { VALID_PLUGINS } from '../src/internal/plugins'

const execFileAsync = promisify(execFile)

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = dirname(TEST_DIR)
const GENERATOR = join(REPO_ROOT, 'scripts', 'generate-quasar-lists.mjs')
const GENERATED_FILE = join(REPO_ROOT, 'src', 'internal', 'generated-quasar-lists.ts')
const QUASAR_DIR = join(REPO_ROOT, 'node_modules', 'quasar')
const EXTRAS_DIR = join(REPO_ROOT, 'node_modules', '@quasar', 'extras')

async function runGenerator(args: string[]): Promise<{ code: number, stdout: string, stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [GENERATOR, ...args], { cwd: REPO_ROOT })
    return { code: 0, stdout, stderr }
  }
  catch (error) {
    const err = error as { code?: number, stdout?: string, stderr?: string }
    return { code: err.code ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' }
  }
}

describe('generate-quasar-lists source extraction', () => {
  it('extracts animation groups from the installed animate-list.js', async () => {
    const upstream = await import(pathToFileURL(join(EXTRAS_DIR, 'exports', 'animate', 'animate-list.js')).href) as {
      generalAnimations: string[]
      inAnimations: string[]
      outAnimations: string[]
    }

    expect([...Generated.GENERATED_GENERAL_ANIMATIONS].sort()).toEqual([...upstream.generalAnimations].sort())
    expect([...Generated.GENERATED_IN_ANIMATIONS].sort()).toEqual([...upstream.inAnimations].sort())
    expect([...Generated.GENERATED_OUT_ANIMATIONS].sort()).toEqual([...upstream.outAnimations].sort())
    expect(Generated.GENERATED_GENERAL_ANIMATIONS.length).toBeGreaterThan(0)
  })

  it('extracts orphan animations as css files missing from animate-list.js', async () => {
    const animateDir = join(EXTRAS_DIR, 'exports', 'animate')
    const cssNames = (await readdir(animateDir))
      .filter(name => name.endsWith('.css'))
      .map(name => name.slice(0, -'.css'.length))
    const listed: ReadonlySet<string> = new Set([
      ...Generated.GENERATED_GENERAL_ANIMATIONS,
      ...Generated.GENERATED_IN_ANIMATIONS,
      ...Generated.GENERATED_OUT_ANIMATIONS,
    ])

    expect([...Generated.GENERATED_ORPHAN_ANIMATIONS].sort())
      .toEqual(cssNames.filter(name => !listed.has(name)).sort())
    expect(Generated.GENERATED_ORPHAN_ANIMATIONS).toContain('lightSpeedIn')
  })

  it('extracts every shipped icon-set file, leaving Pro exclusion to handwritten policy', async () => {
    const shipped = (await readdir(join(QUASAR_DIR, 'icon-set')))
      .filter(name => name.endsWith('.js'))
      .map(name => name.slice(0, -'.js'.length))
      .sort()

    expect([...Generated.GENERATED_ICON_SETS_SHIPPED].sort()).toEqual(shipped)
    // Policy boundary: the generator keeps Pro variants; handwritten policy drops them.
    expect(Generated.GENERATED_ICON_SETS_SHIPPED).toContain('fontawesome-v7-pro')
    expect((VALID_ICON_SETS as readonly string[])).not.toContain('fontawesome-v7-pro')
  })

  it('extracts css-capable extras dirs, leaving font exclusion to handwritten policy', async () => {
    const entries = await readdir(join(EXTRAS_DIR, 'exports'), { withFileTypes: true })
    const cssDirs: string[] = []
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'animate') continue
      try {
        await readFile(join(EXTRAS_DIR, 'exports', entry.name, `${entry.name}.css`))
        cssDirs.push(entry.name)
      }
      catch {
        // No css bundle for this export dir (e.g. svg-only sets): not an icon library.
      }
    }

    expect([...Generated.GENERATED_ICON_LIBRARIES_SHIPPED].sort()).toEqual(cssDirs.sort())
    // Policy boundary: the generator keeps text fonts; handwritten policy drops them.
    expect(Generated.GENERATED_ICON_LIBRARIES_SHIPPED).toContain('roboto-font')
    expect((VALID_ICON_LIBRARIES as readonly string[])).not.toContain('roboto-font')
  })

  it('extracts modern langs from index.json and alias files from the lang dir', async () => {
    const indexJson = JSON.parse(await readFile(join(QUASAR_DIR, 'lang', 'index.json'), 'utf8')) as Array<{ isoName: string }>
    const modern = indexJson.map(entry => entry.isoName).sort()
    const files = (await readdir(join(QUASAR_DIR, 'lang')))
      .filter(name => name.endsWith('.js'))
      .map(name => name.slice(0, -'.js'.length))
    const aliases = files.filter(name => !modern.includes(name)).sort()

    expect([...Generated.GENERATED_LANG_MODERN].sort()).toEqual(modern)
    expect([...Generated.GENERATED_LANG_ALIAS_FILES].sort()).toEqual(aliases)
    expect(Generated.GENERATED_LANG_ALIAS_FILES).toContain('mm')
    expect((VALID_LANG as readonly string[])).not.toContain('mm')
  })

  it('derives the upstream plugin inventory while curated VALID_PLUGINS stays a strict subset', async () => {
    const apiDir = join(QUASAR_DIR, 'dist', 'api')
    const files = (await readdir(apiDir)).filter(name => name.endsWith('.json'))
    const upstreamPlugins: string[] = []
    for (const file of files) {
      const api = JSON.parse(await readFile(join(apiDir, file), 'utf8')) as { type?: string }
      if (api.type === 'plugin') upstreamPlugins.push(file.slice(0, -'.json'.length))
    }

    expect([...Generated.GENERATED_QUASAR_PLUGINS].sort()).toEqual(upstreamPlugins.sort())
    // Curation boundary: generation must not expand the public auto-install set.
    for (const plugin of VALID_PLUGINS) {
      expect(Generated.GENERATED_QUASAR_PLUGINS).toContain(plugin)
    }
    expect(Generated.GENERATED_QUASAR_PLUGINS.length).toBeGreaterThan(VALID_PLUGINS.length)
  })

  it('pins the installed package versions the snapshot was derived from', async () => {
    const quasarPkg = JSON.parse(await readFile(join(QUASAR_DIR, 'package.json'), 'utf8')) as { version: string }
    const extrasPkg = JSON.parse(await readFile(join(EXTRAS_DIR, 'package.json'), 'utf8')) as { version: string }

    expect(Generated.GENERATED_QUASAR_VERSION).toBe(quasarPkg.version)
    expect(Generated.GENERATED_QUASAR_EXTRAS_VERSION).toBe(extrasPkg.version)
  })
})

describe('generate-quasar-lists policy/curation separation', () => {
  it('exposes only derived data: every export is a GENERATED_ constant', () => {
    for (const key of Object.keys(Generated)) {
      expect(key.startsWith('GENERATED_')).toBe(true)
    }
  })

  it('contains no policy or curation logic in the generated source text', async () => {
    const text = await readFile(GENERATED_FILE, 'utf8')

    expect(text).toContain('DO NOT EDIT')
    expect(text).toContain('generate-quasar-lists')
    expect(text).not.toContain('VALID_')
    expect(text).not.toContain('validate')
    expect(text).not.toContain('normalize')
    expect(text).not.toContain('Map(')
    expect(text).not.toContain('Set(')
  })
})

describe('generate-quasar-lists determinism and --check', () => {
  it('produces byte-identical output on consecutive runs', async () => {
    const before = await readFile(GENERATED_FILE, 'utf8')
    const run = await runGenerator([])
    expect(run.code).toBe(0)
    const after = await readFile(GENERATED_FILE, 'utf8')

    expect(after).toBe(before)
    expect(createHash('sha256').update(after).digest('hex'))
      .toBe(createHash('sha256').update(before).digest('hex'))
  })

  it('--check passes on fresh output without rewriting it', async () => {
    const before = await readFile(GENERATED_FILE, 'utf8')
    const run = await runGenerator(['--check'])

    expect(run.code).toBe(0)
    expect(await readFile(GENERATED_FILE, 'utf8')).toBe(before)
  })

  it('--check fails on stale output without writing it', async () => {
    const original = await readFile(GENERATED_FILE, 'utf8')
    try {
      await writeFile(GENERATED_FILE, `${original}\n// stale-marker\n`, 'utf8')
      const run = await runGenerator(['--check'])

      expect(run.code).not.toBe(0)
      expect(`${run.stdout}\n${run.stderr}`).toMatch(/stale/i)
      expect(await readFile(GENERATED_FILE, 'utf8')).toContain('stale-marker')
    }
    finally {
      await writeFile(GENERATED_FILE, original, 'utf8')
    }

    const fresh = await runGenerator(['--check'])
    expect(fresh.code).toBe(0)
  })
})
