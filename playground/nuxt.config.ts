import { defineNuxtConfig } from 'nuxt'
import QuasarNuxt from '../src/module'

export default defineNuxtConfig({
  modules: [QuasarNuxt],
  quasar: {
    sassVariables: 'assets/styles/quasar.variables.scss',
    css: ['@quasar/extras/material-icons/material-icons.css', 'assets/styles/main.scss']
  }
})
