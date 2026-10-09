import { describe, it, expect } from 'vitest'
import { parseQuasarExportNames } from '../src/internal'

const LABEL = 'the resolved quasar/src/plugins.js (test)'

describe('parseQuasarExportNames (shared Quasar export parser)', () => {
  it('parses single-line re-export names', () => {
    const source = [
      `export { default as Notify } from './plugins/notify/Notify.js'`,
      `export { default as Dialog } from './plugins/dialog/Dialog.js'`,
    ].join('\n')
    expect(parseQuasarExportNames(source, LABEL)).toEqual(['Notify', 'Dialog'])
  })

  it('parses multi-line export list forms', () => {
    const source = `export {\n  Notify,\n  Dialog,\n} `
    expect(parseQuasarExportNames(source, LABEL)).toEqual(['Notify', 'Dialog'])
  })

  it('never matches import statements', () => {
    const source = [
      `import { Notify } from './plugins/notify/Notify.js'`,
      `export { default as Dialog } from './plugins/dialog/Dialog.js'`,
    ].join('\n')
    expect(parseQuasarExportNames(source, LABEL)).toEqual(['Dialog'])
  })

  it('strips comments and quoted strings before collecting names', () => {
    const source = `export { default as Notify /* comment */ } from './plugins/notify/Notify.js'
// export { default as Fake } from './fake.js'
export { default as Dialog } from './plugins/dialog/Dialog.js'`
    expect(parseQuasarExportNames(source, LABEL)).toEqual(['Notify', 'Dialog'])
  })

  it('skips the default member', () => {
    const source = `export { default, Notify }`
    expect(parseQuasarExportNames(source, LABEL)).toEqual(['Notify'])
  })

  it('fails loudly with the source label on empty input', () => {
    expect(() => parseQuasarExportNames('', LABEL)).toThrow(/nuxt-quasar-vite/)
    expect(() => parseQuasarExportNames('', LABEL)).toThrow(LABEL)
  })

  it('fails loudly on input with no export names', () => {
    expect(() => parseQuasarExportNames('// no exports here\nconst x = 1\n', LABEL))
      .toThrow(/nuxt-quasar-vite/)
  })
})
