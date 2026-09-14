import { describe, it, expect, vi } from 'vitest'
import { VALID_ICON_LIBRARIES, warnLegacyIconCss } from '../src/internal'

function createLogger() {
  return { warn: vi.fn() }
}

const QUASAR_CSS = 'quasar/src/css/index.sass'
const LEGACY_MATERIAL_ICONS = '@quasar/extras/material-icons/material-icons.css'

describe('warnLegacyIconCss', () => {
  it('warns once for a known icon library path supplied through css', () => {
    const logger = createLogger()

    warnLegacyIconCss([QUASAR_CSS, LEGACY_MATERIAL_ICONS], logger)

    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(LEGACY_MATERIAL_ICONS))
  })

  it('points the migration at the iconLibraries option', () => {
    const logger = createLogger()

    warnLegacyIconCss([LEGACY_MATERIAL_ICONS], logger)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('iconLibraries'))
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('material-icons'))
  })

  it('stays silent for custom CSS and non-icon extras paths', () => {
    const logger = createLogger()

    warnLegacyIconCss([
      QUASAR_CSS,
      '~/assets/custom.sass',
      '@quasar/extras/animate/fadeIn.css',
      '@quasar/extras/roboto-font/roboto-font.css',
      '@quasar/extras/ionicons-v8/index.js',
    ], logger)

    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('stays silent for an empty css list', () => {
    const logger = createLogger()

    warnLegacyIconCss([], logger)

    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('warns once per distinct legacy path', () => {
    const logger = createLogger()

    warnLegacyIconCss([
      LEGACY_MATERIAL_ICONS,
      '@quasar/extras/mdi-v7/mdi-v7.css',
      QUASAR_CSS,
    ], logger)

    expect(logger.warn).toHaveBeenCalledTimes(2)
  })

  it('warns only once when the same legacy path is listed twice', () => {
    const logger = createLogger()

    warnLegacyIconCss([LEGACY_MATERIAL_ICONS, LEGACY_MATERIAL_ICONS], logger)

    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('recognizes the legacy path of every accepted library', () => {
    expect(VALID_ICON_LIBRARIES).toHaveLength(14)

    for (const name of VALID_ICON_LIBRARIES) {
      const logger = createLogger()
      warnLegacyIconCss([`@quasar/extras/${name}/${name}.css`], logger)
      expect(logger.warn).toHaveBeenCalledTimes(1)
    }
  })

  it('never throws and leaves the css list untouched so imports still emit', () => {
    const logger = createLogger()
    const css = [QUASAR_CSS, LEGACY_MATERIAL_ICONS]

    expect(() => warnLegacyIconCss(css, logger)).not.toThrow()
    expect(warnLegacyIconCss(css, logger)).toBeUndefined()
    expect(css).toEqual([QUASAR_CSS, LEGACY_MATERIAL_ICONS])
  })
})
