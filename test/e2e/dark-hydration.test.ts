import { describe, it, expect } from 'vitest'
import { createPage } from '@nuxt/test-utils/e2e'
import type { NuxtPage } from '@nuxt/test-utils/e2e'
import { browserBuildDir, fixtureDir, setupScoped } from './helpers'

// Console capture is for OBSERVATION, not assertion: hydration warnings are
// findings to report, not failures to silence (same policy as browser-hydration).
function attachConsoleCollector(page: NuxtPage) {
  const entries: string[] = []
  page.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error' || type === 'warning') {
      entries.push(`[${type}] ${msg.text()}`)
    }
  })
  return entries
}

describe('browser · dark-hydration (issue #10: dark-mode hydration mismatch)', () => {
  setupScoped({
    rootDir: fixtureDir('dark-hydration'),
    buildDir: browserBuildDir('dark-hydration'),
    browser: true,
    browserOptions: { type: 'chromium' },
  })

  it('body carries body--dark after hydration when config.dark is true', async () => {
    const page = await createPage('/')
    // createPage defaults to waitUntil: 'hydration', so this reads the
    // post-hydration DOM — the exact signal from the issue.
    const hasDarkBody = await page.evaluate(() =>
      document.body.classList.contains('body--dark'),
    )
    if (!hasDarkBody) {
      const bodyClass = await page.evaluate(() => document.body.className)
      console.error(`[issue-10] body class after hydration: "${bodyClass}"`)
    }
    expect(hasDarkBody).toBe(true)
    await page.close()
  })

  it('SSR HTML body tag carries body--dark class', async () => {
    const page = await createPage('/')
    // Raw SSR HTML: fetch the server-rendered document so the assertion reads
    // the <body> tag the server actually emitted (the page DOM itself is
    // already post-hydration when createPage resolves). This is the
    // root-cause signal from issue #10: the bridge must put body--dark into
    // the SSR body tag.
    const res = await page.request.get(page.url())
    const html = await res.text()
    const bodyTag = html.match(/<body[^>]*>/)?.[0] ?? ''
    expect(bodyTag).toContain('body--dark')
    // After hydration, body should still have body--dark (the bridge ensures
    // the SSR HTML had it, and client-side Dark preserves it)
    const bodyClass = await page.evaluate(() => document.body.className)
    expect(bodyClass).toContain('body--dark')
    await page.close()
  })

  it('dark-variant elements and body state are consistent after hydration', async () => {
    const page = await createPage('/')
    const result = await page.evaluate(() => ({
      bodyDark: document.body.classList.contains('body--dark'),
      darkElements: document.querySelectorAll('[class*="--dark"]').length,
      qDarkElements: document.querySelectorAll('.q-dark').length,
    }))
    if (!result.bodyDark && result.darkElements > 0) {
      console.error(
        `[issue-10] body=light but ${result.darkElements} dark elements `
        + `(${result.qDarkElements} with .q-dark) remain in DOM`,
      )
    }
    // Internal consistency: body dark → dark elements present;
    // body light → zero dark elements. Either state must be coherent.
    expect(result.bodyDark).toBe(true)
    expect(result.darkElements).toBeGreaterThan(0)
    await page.close()
  })

  it('no Vue hydration class mismatch warnings in dev', async () => {
    const page = await createPage('/')
    const consoleEntries = attachConsoleCollector(page)
    await page.waitForSelector('.q-layout', { timeout: 10_000 })
    // Allow late hydration warnings to flush before reading.
    await page.waitForTimeout(500)
    const mismatches = consoleEntries.filter(e =>
      e.includes('Hydration class mismatch'),
    )
    if (mismatches.length > 0) {
      console.log(
        `[issue-10] ${mismatches.length} hydration class mismatches:`,
        JSON.stringify(mismatches.slice(0, 5), null, 2),
      )
    }
    expect(mismatches).toHaveLength(0)
    await page.close()
  })
})
