import { defineNuxtConfig } from 'nuxt'
import QuasarNuxt from '..'

export default defineNuxtConfig({
  modules: [QuasarNuxt],
  build: {
    transpile: ['quasar']
  },
  quasar: {
    sassVariables: false,
    css: ['@quasar/extras/material-icons/material-icons.css']
  }
})
