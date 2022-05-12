# Quasar for Nuxt

This Nuxt module expose UI Components and Utils (Composables, Directives and Plugins) from Quasar Framework UI to Nuxt.
This is done by using `quasar-vite-plugin`. For this reason this module only can be use on Nuxt with Vite: `nuxt ^3.0.0-rc.2`.

## Install

At your Nuxt project folder:

```
sh

# Install dependencies
yarn add -D quasar nuxt-quasar-vite @quasar/extras
```

`@quasar/extras` is optional

```
ts
nuxt.config.ts

defineNuxtConfig({
  // Add nuxt-quasar-vite to modules
  modules: ['nuxt-quasar-vite'],

  // Optionaly use 'quasar' configKey
  // This are the defaults
  quasar: {
    sassVariables: 'assets/quasar.variables.scss', // Optional string | boolean default true
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

[x] Directives like `v-ripple` doesn't work. There is an [issue](https://github.com/quasarframework/quasar/issues/13154) with `vue ^3.2.33`. I propose a [PR](https://github.com/quasarframework/quasar/pull/13402) to a temporary fix. The current [best solution](https://github.com/quasarframework/quasar/issues/13154#issuecomment-1113273509) is expose `$q` on `<script setup>` on components using `v-ripple`.

## Development

- Run `yarn dev:prepare` to generate type stubs.
- Use `yarn dev` to start [playground](./playground) in development mode.
