# Quasar for Nuxt

This Nuxt module expose UI Components and Utils (Composables, Directives and Plugins) from Quasar Framework UI to Nuxt. This module only can be use on Nuxt with Vite: `nuxt ^3.0.0-rc.2`.

## Pros

- Nuxt SSR for Quasar components.
- Quasar components that are auto imported by Nuxt.
- Quasar directives.
- Quasar composables that are auto imported by Nuxt.
- Quasar plugins, opt-in imported.
- Quasar variables on SFC styles and SASS/SCSS files.
- Quasar utils that are auto imported by Nuxt.
- Nuxt modern and universal, develop and production Nitro server (with API and Middlewares).
- Nuxt SSG static site generate.

## Cons

- Not all directives have been tested. There is an issue with `v-ripple` (more related to `vue` than quasar or nuxt), you can read about it in the TODO section.
- No Quasar Develop Modes (Electron, Capcitor, BEX, etc.)
- ~~The use of `ClientOnly` Nuxt component on your Layout~~.

## Setup

At your Nuxt project folder:

```sh
# Install dependencies
yarn add -D quasar sass@1.32.0 @quasar/extras nuxt-quasar-vite
```
`@quasar/extras` is optional.

At `nuxt.config.ts` add module name and `quasar` to `build.transpile`:

```ts
defineNuxtConfig({
  //...
  // Add quasar to build.transpile is OPTIONAL since v1.0.3
  build: {
    transpile: ['quasar']
  },
  // Add nuxt-quasar-vite to modules
  modules: ['nuxt-quasar-vite'],
  //...
})
```

Add Quasar components to your vue files:

```vue
<template>
  <QLayout view="hHh lpR fFf">
    <QPageContainer>
      <QPage padding class="column flex-center q-gutter-xl">
        <slot />
      </QPage>
    </QPageContainer>
  </QLayout>
</template>
```

## Config

### Defaults

```ts
{
  sassVariables: true,
  css: ['quasar/src/css/index.sass'],
  plugins: ['Notify'],
  config: {
    dark: true
  }
}
```

### Options

At `nuxt.config.ts` you can add a `quasar` configKey object:

```ts
defineNuxtConfig({
  // Optionaly use 'quasar' configKey
  // ...
  quasar: {
    // Optional string | boolean
    sassVariables: 'assets/quasar.variables.scss',
    // Optional string[]
    // If you use animations, add Quasar Extra CSS animation URL here.
    css: ['@quasar/extras/material-icons/material-icons.css'],
    // List of extra Quasar Plugins
    // auto-instaled: [Platform, Body, Dark, Screen, History, Lang, IconSet]
    // optional: [AddressbarColor, AppFullscreen, AppVisibility, BottomSheet, Dialog,
    //            LoadingBar, Loading, Notify, LocalStorage, SessionStorage]
    plugins: ['Dialog'],
    /* Quasar UI config -- you'll notice in Quasar docs when you need it */
    config: { 
      dark: false
    } 
  }
  // ...
})
```

### Quasar Utils

For use Quasar Utils autoimport feature, prefix quasar util function name with `q` character. This is a difference with Quasar Framework, but make using utils safe.

```vue
<script setup>
// Autoimport Quasar Util `date` using `qdate` 
const { addToDate } = qdate
const newDate = addToDate(new Date(), {days: 7, months: 1})
</script>
```

For more information, you can read the [Quasar Vite Plugin docs](https://quasar.dev/start/vite-plugin), and `quasar.config.ts` [framework](https://quasar.dev/quasar-cli-vite/quasar-config-js#framework) docs.

## TODO

- Directive `v-ripple` doesn't work. There is an [issue](https://github.com/quasarframework/quasar/issues/13154) with `vue ^3.2.33`. I propose a [PR](https://github.com/quasarframework/quasar/pull/13402) to a temporary fix. The current [best solution](https://github.com/quasarframework/quasar/issues/13154#issuecomment-1113273509) is `defineExpose({$q})` on `<script setup>` on components using `v-ripple`. Example at: `./playgraound/app.vue`.
- Test animations.
- ~~Add Quasar Utils~~.
- ~~Stop using `ClientOnly` component~~.

## Development

- `git clone https://github.com/memotux/nuxt-quasar.git`
- Run `yarn dev:prepare` to generate type stubs.
- Use `yarn dev` to start [playground](./playground) in development mode.
