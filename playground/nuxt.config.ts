import { defineNuxtConfig } from 'nuxt'
import QuasarNuxt from '..'

export default defineNuxtConfig({
  modules: [QuasarNuxt],
  build: {
    transpile: ['quasar']
  },
  quasar: {
    sassVariables: 'assets/styles/quasar.variables.scss',
    css: ['@quasar/extras/material-icons/material-icons.css', 'assets/styles/main.scss']
  }
})
