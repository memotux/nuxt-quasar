# Quasar for Nuxt

This Nuxt module expose UI Components and Utils (Composables, Directives and Plugins) from Quasar Framework UI to Nuxt.
This is done by using `quasar-vite-plugin`. For this reason this module only can be use on Nuxt with Vite: `nuxt ^3.0.0-rc.2`.

## Pros

- Quasar components that are auto imported by Nuxt.
- Quasar composables that are auto imported by Nuxt.
- Quasar utils that are auto imported by Nuxt.
- Quasar optional plugins, opt-in imported.
- Quasar variables on SFC styles and SASS/SCSS files.
- Nuxt modern and universal, develop and production Nitro server (with API and Middlewares).
- Nuxt SSG static site generate.

## Cons

- Not all directives have been tested. There is an issue with `v-ripple` (more related to `vue` than quasar or nuxt), you can read about it in the TODO section.
- The use of `ClientOnly` Nuxt component on your Layout.
- No Quasar Develop Modes (Electron, Capcitor, BEX, etc.)

## Setup

At your Nuxt project folder:

```sh
# Install dependencies
yarn add -D quasar nuxt-quasar-vite @quasar/extras
```
`@quasar/extras` is optional.

Add module name at `nuxt.config.ts`:

```ts
defineNuxtConfig({
  //...
  // Add nuxt-quasar-vite to modules
  modules: ['nuxt-quasar-vite'],
  //...
})
```

Add `<ClientOnly>` Nuxt component to your main layout (component or layout folder):

```vue
<template>
  <ClientOnly>
    <QLayout view="hHh lpR fFf">
      <QPageContainer>
        <QPage padding class="column flex-center q-gutter-xl">
          <slot />
        </QPage>
      </QPageContainer>
    </QLayout>
  </ClientOnly>
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
  // This are the defaults
  // ...
  quasar: {
    // Optional string | boolean default true
    sassVariables: 'assets/quasar.variables.scss',
    // Optional string[]
    css: ['@quasar/extras/material-icons/material-icons.css'],
    // List of extra Quasar Plugins
    plugins: ['Dialog'],
    /* Quasar UI config -- you'll notice in Quasar docs when you need it */
    config: { 
      dark: false
    } 
  }
  // ...
})
```

For more information, you can read the [Quasar Vite Plugin docs](https://quasar.dev/start/vite-plugin), and `quasar.config.ts` [framework](https://quasar.dev/quasar-cli-vite/quasar-config-js#framework) docs.

## TODO

[x] Directive `v-ripple` doesn't work. There is an [issue](https://github.com/quasarframework/quasar/issues/13154) with `vue ^3.2.33`. I propose a [PR](https://github.com/quasarframework/quasar/pull/13402) to a temporary fix. The current [best solution](https://github.com/quasarframework/quasar/issues/13154#issuecomment-1113273509) is `defineExpose({$q})` on `<script setup>` on components using `v-ripple`.

[ ] Stop using `ClientOnly` component.
[ ] Test animations.
[ ] Add optional Utils.

## Development

- `git clone https://github.com/memotux/nuxt-quasar.git`
- Run `yarn dev:prepare` to generate type stubs.
- Use `yarn dev` to start [playground](./playground) in development mode.
