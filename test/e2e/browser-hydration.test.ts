import { describe, it, expect } from 'vitest'
import { createPage } from '@nuxt/test-utils/e2e'
import { browserBuildDir, fixtureDir, setupScoped } from './helpers'

// Console capture is for OBSERVATION, not assertion: the browser layer has
// never run against this module, and client-side Quasar/Nuxt warnings are
// findings to report, not failures to silence.
function attachConsoleCollector(page: { on: (event: string, cb: (msg: unknown) => void) => void }) {
  const entries: string[] = []
  page.on('console', (msg) => {
    const type = (msg as { type?: () => string }).type?.() ?? 'unknown'
    if (type === 'error' || type === 'warning') {
      entries.push(`[${type}] ${(msg as { text?: () => string }).text?.() ?? ''}`)
    }
  })
  return entries
}

describe('browser · basic fixture (hydration takeover + interactivity)', () => {
  setupScoped({
    rootDir: fixtureDir('basic'),
    buildDir: browserBuildDir('basic'),
    browser: true,
    browserOptions: { type: 'chromium' },
  })

  it('QBtn is interactive after hydration: a click dispatches a visible Notify', async () => {
    const page = await createPage('/') // createPage(path) defaults to waitUntil: 'hydration'
    const consoleEntries = attachConsoleCollector(page)
    const btn = await page.waitForSelector('button.q-btn', { timeout: 10_000 })
    await btn.click()
    await page.waitForSelector('.q-notification', { timeout: 5_000 })
    const text = await page.textContent('.q-notification')
    expect(text).toContain('hydration-ok')
    await page.close()
    if (consoleEntries.length > 0) {
      console.log('[browser-observation] basic/console:', JSON.stringify(consoleEntries, null, 2))
    }
  })

  it('resolves a real $q.screen class after the SSR takeover', async () => {
    const page = await createPage('/', { viewport: { width: 1024, height: 768 } })
    const name = await page.evaluate(() => {
      const app = window.useNuxtApp()
      return app.vueApp.config.globalProperties.$q.screen?.name
    })
    // Post-takeover, Screen resolves a real breakpoint class (pre-init it
    // does not). 1024x768 maps to 'md', but assert the class set, not one
    // value, so viewport policy changes do not make this brittle.
    expect(name).toMatch(/^(xs|sm|md|lg|xl)$/)
    await page.close()
  })
})

describe('browser · ssr-off fixture (client-side render)', () => {
  setupScoped({
    rootDir: fixtureDir('ssr-off'),
    buildDir: browserBuildDir('ssr-off'),
    browser: true,
    browserOptions: { type: 'chromium' },
  })

  it('client-renders the Quasar app after hydration (the SPA path WU-3 left unverified)', async () => {
    const page = await createPage('/')
    const consoleEntries = attachConsoleCollector(page)
    const btn = await page.waitForSelector('button.q-btn', { timeout: 10_000 })
    expect(btn).toBeTruthy()
    const version = await page.textContent('#q-version')
    const quasar = await import('quasar/package.json', { with: { type: 'json' } })
    expect(version?.trim()).toBe(quasar.default.version)
    await page.close()
    if (consoleEntries.length > 0) {
      console.log('[browser-observation] ssr-off/console:', JSON.stringify(consoleEntries, null, 2))
    }
  })
})
