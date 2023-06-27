# Quasar for Nuxt

This Nuxt module expose UI Components and Utils (Composables, Directives and Plugins) from Quasar Framework UI to Nuxt. This module only can be use on Nuxt with Vite: `nuxt ^3.0.0-rc.2`.

## Pros

- Nuxt SSR for Quasar components.
- Quasar components that are auto imported by Nuxt.
- Quasar directives.
- Quasar composables that are auto imported by Nuxt.
- Quasar plugins, opt-in imported.
- Quasar variables on SFC styles.
- Quasar utils that are auto imported by Nuxt.
- Nuxt modern and universal, develop and production Nitro server (with API and Middlewares).
- Nuxt SSG static site generate.

## Cons

- No Quasar Develop Modes (Electron, Capcitor, BEX, etc.)

## Setup

At your Nuxt project folder:

```sh
# Install dependencies
yarn add -D quasar sass@1.32.12 @quasar/extras nuxt-quasar-vite
```

`@quasar/extras` is optional.

At `nuxt.config.ts` add module name:

```ts
defineNuxtConfig({
  //...
  // Add nuxt-quasar-vite to modules
  modules: ["nuxt-quasar-vite"],
  //...
});
```

Add Quasar components to your vue files:

```vue
<!-- app.vue or layouts/default.vue -->
<template>
  <QLayout view="hHh lpR fFf">
    <QPageContainer>
      <QPage padding class="column flex-center q-gutter-xl">
        <!-- if on layouts use `slot`. if on app.vue use `NuxtPage` -->
        <slot />
      </QPage>
    </QPageContainer>
  </QLayout>
</template>
```

## Nuxt Starter Template

There is available a Starter Template. [Repository](https://github.com/memotux/nuxt-quasar-template)

In this template are configured:

- Default Layout: `layouts/defaults.vue`
- Default Pages like `index.vue`
- Use `@nuxt/content@^2.1.1` and `@nuxt/image-edge`, and modifies `ProseImg` to use `QImg`.

### Install

```sh
# <nuxt-app> it's the name of your project folder
npx nuxi init -t gh:memotux/nuxt-quasar-template <nuxt-app>

cd <nuxt-app>

yarn install
```

## Config

### Defaults

```ts
quasar : {
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
    sassVariables: "assets/quasar.variables.scss",
    // Optional string[]
    // If you use animations, add Quasar Extra CSS animation URL here.
    // NOTE: This CSS files are inserted on module plugin template, NOT on `nuxt.config`.
    css: ["@quasar/extras/material-icons/material-icons.css"],
    // List of extra Quasar Plugins
    // auto-instaled: [Platform, Body, Dark, Screen, History, Lang, IconSet]
    // optional: [AddressbarColor, AppFullscreen, AppVisibility, BottomSheet, Dialog,
    //            LoadingBar, Loading, Notify, LocalStorage, SessionStorage]
    plugins: ["Dialog"],
    /* Quasar UI config -- you'll notice in Quasar docs when you need it */
    config: {
      dark: false,
    },
  },
  // ...
});
```

### Quasar Utils

For use Quasar Utils autoimport feature, prefix quasar util function name with `q` character. This is a difference with Quasar Framework, but make using utils safe.

```vue
<script setup>
// Autoimport Quasar Util `date` using `qdate`
const newDate = qdate.addToDate(new Date(), { days: 7, months: 1 });

// Or use explicit #imports if you want to destructurate
import { qdate } from "#imports";

const { addToDate } = qdate;
const newDate = addToDate(new Date(), { days: 7, months: 1 });
</script>
```

### Quasar SCSS variables

Quasar SCSS variables and custom `sassVariables` are auto imported on your SASS/SCSS assets files.

```scss
.container {
  border-color: $primary;
}
```

For more information, you can read the [Quasar Vite Plugin docs](https://quasar.dev/start/vite-plugin), and `quasar.config.ts` [framework](https://quasar.dev/quasar-cli-vite/quasar-config-js#framework) docs.

## TODO

- Add to quasar configKey animations.
- Add to quasar configKey iconSet and icon libraries.

## Development

- `git clone https://github.com/memotux/nuxt-quasar.git`
- Run `yarn dev:prepare` to generate type stubs.
- Use `yarn dev` to start [playground](./playground) in development mode.
