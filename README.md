# Quasar for Nuxt

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![license][license-src]][license-href]

This Nuxt module exposes UI Components and Utils (Composables, Directives and Plugins) from [Quasar Framework](https://quasar.dev) to Nuxt. It works on Vite-based Nuxt projects (`nuxt >= 3.0.0-rc.2`, Nuxt 3 and 4).

## Features

- Nuxt SSR for Quasar components, with Quasar SSR hydration takeover.
- Quasar components (`Q*`) auto-imported by Nuxt.
- Quasar directives installed globally.
- Quasar composables auto-imported by Nuxt.
- Quasar plugins, opt-in and validated at setup time.
- Quasar variables on SFC styles.
- Quasar utils auto-imported by Nuxt with a `q` prefix.
- Works with Nuxt development, production and universal Nitro servers (API and middlewares), and with Nuxt SSG.

## Limitations

- No Quasar Develop Modes (Electron, Capacitor, BEX, etc.): web apps only.

## Setup

In your Nuxt project folder:

```sh
# Install dependencies
pnpm add -D quasar sass-embedded @quasar/extras nuxt-quasar-vite
```

- `quasar` and `sass-embedded` are peer dependencies of the module.
- `@quasar/extras` is optional (fonts and icon sets).

Add the module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-quasar-vite'],
})
```

Add Quasar components to your Vue files:

```vue
<!-- app.vue or layouts/default.vue -->
<template>
  <QLayout view="hHh lpR fFf">
    <QPageContainer>
      <QPage padding class="column flex-center q-gutter-xl">
        <!-- on layouts use `slot`; on app.vue use `NuxtPage` -->
        <slot />
      </QPage>
    </QPageContainer>
  </QLayout>
</template>
```

## Starter Template

There is a starter template available: [Repository](https://github.com/memotux/nuxt-quasar-template)

It comes configured with:

- Default layout: `layouts/default.vue`
- Default pages like `index.vue`
- `@nuxt/content` and `@nuxt/image`, with `ProseImg` modified to use `QImg`.

### Install

```sh
# <nuxt-app> is the name of your project folder
pnpx nuxi init -t gh:memotux/nuxt-quasar-template <nuxt-app>

cd <nuxt-app>

pnpm install
```

## Configuration

### Defaults

```ts
quasar: {
  sassVariables: true,
  css: ['quasar/src/css/index.sass'],
  plugins: ['Notify'],
  config: {
    dark: true,
  },
}
```

### Options

Set a `quasar` config key on `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  // ...
  quasar: {
    // Inject Quasar variables on your SASS/SCSS files.
    // - `true`: default Quasar variables
    // - string: path to your custom variables file
    sassVariables: 'assets/quasar.variables.scss',

    // Extra CSS files, injected on the module plugin template (not `nuxt.config`).
    // If you use animations, add the Quasar Extras CSS animation URL here.
    css: ['@quasar/extras/material-icons/material-icons.css'],

    // List of opt-in Quasar plugins. Unknown names fail at setup time
    // with the list of valid plugins.
    plugins: ['Dialog'],

    // Quasar UI config — see the Quasar docs when you need it.
    config: {
      dark: false,
    },
  },
  // ...
})
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `sassVariables` | `boolean \| string` | `true` | Auto-inject Quasar variables into all your SASS/SCSS. A string is a path to your custom variables file (relative to the project root, e.g. `assets/quasar.variables.scss`), imported before Quasar's so it can override defaults. |
| `css` | `string[]` | `['quasar/src/css/index.sass']` | CSS imported by the generated Quasar plugin (e.g. icon fonts from `@quasar/extras`). |
| `plugins` | `string[]` | `['Notify']` | Opt-in Quasar plugins, validated at setup. |
| `config` | `object` | `{ dark: true }` | Quasar UI config passed to `installQuasar`. `dark` is the typed option; other keys are forwarded as-is. |

### Quasar plugins

These Quasar core plugins are always auto-installed by `installQuasar`:
`Platform`, `Body`, `Dark`, `Screen`, `History`, `Lang`, `IconSet`.

The following opt-in plugins can be added via the `plugins` option:
`AddressbarColor`, `AppFullscreen`, `AppVisibility`, `BottomSheet`, `Dialog`, `LoadingBar`, `Loading`, `Notify`, `LocalStorage`, `SessionStorage`.

Unknown plugin names throw at setup time with the list of valid plugins.

## Auto-imports

### Components

All Quasar components (`Q*`) are auto-imported by Nuxt, tree-shaken per usage — use them directly in templates without imports.

### Composables

`useQuasar`, `useDialogPluginComponent` and `useFormChild` are auto-imported.

```vue
<script setup lang="ts">
const $q = useQuasar()

$q.notify('Hello!')
</script>
```

### Utils

For the Quasar Utils auto-import feature, prefix the util name with a `q` character. This differs from Quasar Framework itself, but makes using utils safe.

```vue
<script setup lang="ts">
// Auto-import Quasar util `date` as `qdate`
const newDate = qdate.addToDate(new Date(), { days: 7, months: 1 })

// Or use explicit #imports if you want to destructurate
import { qdate } from '#imports'

const { addToDate } = qdate
const newDate = addToDate(new Date(), { days: 7, months: 1 })
</script>
```

Available utils: `qclone`, `qcolors`, `qcopyToClipboard`, `qcreateMetaMixin`, `qcreateUploaderComponent`, `qdate`, `qdebounce`, `qdom`, `qevent`, `qexportFile`, `qextend`, `qformat`, `qframeDebounce`, `qgetCssVar`, `qnoop`, `qmorph`, `qopenURL`, `qpatterns`, `qscroll`, `qsetCssVar`, `qthrottle`, `quid`.

### Directives

All Quasar directives (e.g. `v-ripple`) are installed globally by the plugin, as with a standard Quasar installation.

## Quasar SCSS variables

Quasar variables are auto-injected into every SASS/SCSS compilation — including `<style lang="scss">` blocks in your SFCs — via the Vite preprocessor `additionalData` option. You don't import them yourself.

The `sassVariables` option (configured on `nuxt.config` under `quasar.sassVariables`) has two modes:

- `true` (default): injects Quasar's own variables (`quasar/src/css/variables.sass`).
- `'<path>'`: additionally injects your custom variables file — typically `assets/quasar.variables.scss` — imported **before** Quasar's variables, so its values override the defaults:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // ...
  quasar: {
    sassVariables: 'assets/quasar.variables.scss',
  },
})
```

```scss
// assets/quasar.variables.scss
$primary: #9c27b0;
```

With that in place, Quasar variables are available in any style:

```scss
.container {
  border-color: $primary;
}
```

For more information, read the [Quasar Vite Plugin docs](https://quasar.dev/start/vite-plugin) and the `quasar.config.ts` [framework](https://quasar.dev/quasar-cli-vite/quasar-config-js#framework) docs.

## Roadmap

- Add animations to the `quasar` config key.
- Add `iconSet` and icon libraries options to the `quasar` config key.

## Development

- Clone the repo: `git clone https://github.com/memotux/nuxt-quasar.git`
- Install dependencies: `pnpm install`
- Generate type stubs: `pnpm dev:prepare`
- Start the [playground](./playground) in dev mode: `pnpm dev`
- Build the playground: `pnpm dev:build` (or `pnpm dev:generate` for SSG)
- Run tests: `pnpm test`
- Lint: `pnpm lint`
- Type-check: `pnpm test:types`

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-quasar-vite/latest.svg
[npm-version-href]: https://npmjs.com/package/nuxt-quasar-vite
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-quasar-vite.svg
[npm-downloads-href]: https://npmjs.com/package/nuxt-quasar-vite
[license-src]: https://img.shields.io/npm/l/nuxt-quasar-vite.svg
[license-href]: https://npmjs.com/package/nuxt-quasar-vite
