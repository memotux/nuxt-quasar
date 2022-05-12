# Quasar for Nuxt

This Nuxt module expose UI Components and Utils (Composables, Directives and Plugins) from Quasar Framework to Nuxt.
This is done by using `quasar-vite-plugin`. For this reason this module only can be use on Nuxt with Vite: `nuxt ^3.0.0-rc.2`.

## Install

At your Nuxt project folder:

```
sh

# Install dependencies
yarn add quasar nuxt-quasar @quasar/extras
```

`@quasar/extra` is optional

```
ts
nuxt.config.ts

defineNuxtConfig({
  // Add nuxt-quasar to modules
  modules: ['nuxt-quasar'],

  // Optionaly use 'quasar' configKey
  // This are the defaults
  quasar: {
    sassVariables: 'assets/quasar.variables.scss', // Optional string | boolean
    css: ['quasar/src/css/index.sass'] // Optional string[]
    plugins: ['Notify'], // List of extra Quasar Plugins
    // This Object accepts all options of framework.config on quasar.config.ts
    config: {
      dark: true
    } 
  }
})
```

For more information, you can read the Quasar Vite Plugin docs, and `quasar.config.ts` framework docs.

## TODO

- Directives like `v-ripple` doesn't work.
- Own 'quasar-install'

## Development

- Run `yarn dev:prepare` to generate type stubs.
- Use `yarn dev` to start [playground](./playground) in development mode.
