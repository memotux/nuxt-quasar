import QuasarNuxt from '../../../src/module'

export default defineNuxtConfig({
  modules: [QuasarNuxt],
  compatibilityDate: '2024-08-27',
  quasar: {
    sassVariables: true,
    css: ['quasar/src/css/index.sass'],
    animations: ['fadeIn', 'bounceInLeft'],
    iconLibraries: ['mdi-v7', 'material-icons'],
    iconSet: 'mdi-v7',
    lang: 'es',
    plugins: ['Notify', 'Dialog', 'LocalStorage'],
    config: {
      dark: true,
      brand: { primary: '#ff0000' },
    },
  },
})
