import QuasarNuxt from '../src/module'

export default defineNuxtConfig({
  modules: [QuasarNuxt],
  css: ['assets/styles/main.scss'],
  compatibilityDate: '2024-08-27',
  quasar: {
    sassVariables: 'assets/styles/quasar.variables.scss',
    iconLibraries: ['material-icons'],
    animations: ['fadeIn'],
  },
})
