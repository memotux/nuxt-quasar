import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<p>Click/tap me</p>')
  })

  it('uses the installed Quasar version in the generated plugin', async () => {
    const plugin = await readFile(fileURLToPath(new URL('../playground/.nuxt/quasar/plugin.ts', import.meta.url)), 'utf8')
    const quasar = await import('quasar/package.json', { with: { type: 'json' } })

    expect(plugin).toContain(`version: '${quasar.default.version}'`)
  })

  it('includes the configured animation in the generated plugin', async () => {
    const plugin = await readFile(fileURLToPath(new URL('../playground/.nuxt/quasar/plugin.ts', import.meta.url)), 'utf8')
    expect(plugin).toContain('import \'@quasar/extras/animate/fadeIn.css\'')
  })
})
