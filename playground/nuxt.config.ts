import QuasarNuxt from '../src/module'

export default defineNuxtConfig({
  modules: [QuasarNuxt],
  css: ['assets/styles/main.scss'],
  compatibilityDate: '2024-08-27',
  quasar: {
    sassVariables: 'assets/styles/quasar.variables.scss',
    css: ['@quasar/extras/material-icons/material-icons.css'],
  },
})
