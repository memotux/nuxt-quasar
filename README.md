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
  animations: [],
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
    css: ['@quasar/extras/material-icons/material-icons.css'],

    // Quasar CSS animations, or 'all' to include the complete animation bundle.
    // Unknown names fail at setup time with a did-you-mean suggestion.
    animations: ['fadeIn'],

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
| `css` | `string[]` | `['quasar/src/css/index.sass']` | CSS imported by the generated Quasar plugin. Use as an escape hatch for custom fonts or non-typed CSS. |
| `animations` | `'all' \| string[]` | `[]` | Quasar CSS animations imported from `@quasar/extras`. |
| `iconLibraries` | `string[]` | `[]` | Quasar CSS icon font libraries imported from `@quasar/extras`. Validated at setup. |
| `iconSet` | `string` | — (Quasar's bundled `material-icons`) | Selects the Quasar Icon Set mapping passed to `installQuasar`. One of 41 typed names, validated at setup. `svg-*` names require `@quasar/extras`. |
| `lang` | `string` | — (Quasar's bundled `en-US`) | Selects the Quasar Language Pack passed to `installQuasar`. One of 71 typed modern names, validated at setup. |
| `plugins` | `string[]` | `['Notify']` | Opt-in Quasar plugins, validated at setup. |
| `config` | `QuasarUIConfiguration` | `{ dark: true }` | Quasar UI config passed to `installQuasar`. Fully typed using Quasar's `QuasarUIConfiguration` interface. |

### Animations

Enable named animations from `@quasar/extras` and use them with the `animated` base class:

```vue
<div class="animated fadeIn">Content</div>
```

The `.animated` base class and the `--animate-duration`, `--animate-delay`, and `--animate-repeat` CSS variables come from Quasar's own CSS. Keep `quasar/src/css/index.sass` in the `css` option so those definitions remain available. The `prefers-reduced-motion` guard is included there as well.

Use `animations: 'all'` to include all 98 animations. This adds approximately 30 KB of raw CSS (about 5 KB gzipped), so prefer individual names when possible. The option requires the optional `@quasar/extras` package.

Two CSS files, `lightSpeedIn` and `lightSpeedOut`, are intentionally not in the typed animation list or the `'all'` bundle. Use the `css` option as an escape hatch:

```ts
css: ['@quasar/extras/animate/lightSpeedIn.css']
```

See the [Quasar animations documentation](https://quasar.dev/options/animations).

### Icon libraries

Enable typed CSS icon font libraries from `@quasar/extras`:

```ts
quasar: {
  iconLibraries: ['material-icons', 'mdi-v7'],
}
```

The option accepts an array of library names. Unknown names fail at setup time with a did-you-mean suggestion. The option requires the optional `@quasar/extras` package.

Valid libraries: `bootstrap-icons`, `eva-icons`, `fontawesome-v7`, `ionicons-v4`, `line-awesome`, `material-icons`, `material-icons-outlined`, `material-icons-round`, `material-icons-sharp`, `material-symbols-outlined`, `material-symbols-rounded`, `material-symbols-sharp`, `mdi-v7`, `themify`.

If you were previously importing icon libraries via `css`, migrate to `iconLibraries`:

```ts
// Before (deprecated, still works with a warning):
css: ['@quasar/extras/material-icons/material-icons.css']

// After (typed and validated):
iconLibraries: ['material-icons']
```

### Icon set

Select which Quasar Icon Set mapping your components use:

```ts
quasar: {
  iconSet: 'mdi-v7',
}
```

The option accepts a single name — Quasar supports exactly one active Icon Set, so arrays and the `'all'` shorthand are rejected. Unknown names fail at setup time with a did-you-mean suggestion. Valid names are the 41 publicly licensed mappings shipped by Quasar: 20 webfont sets (`bootstrap-icons`, `eva-icons`, `fontawesome-v5`, `fontawesome-v6`, `fontawesome-v7`, `ionicons-v4`, `line-awesome`, `material-icons` plus its `-outlined`/`-round`/`-sharp` variants, `material-symbols-outlined`/`-rounded`/`-sharp`, `mdi-v3` through `mdi-v7`, `themify`) and their 21 `svg-*` counterparts.

Webfont mappings are pure JS lookups; bring the matching font CSS yourself, typically via `iconLibraries`:

```ts
quasar: {
  iconSet: 'mdi-v7',
  iconLibraries: ['mdi-v7'],
}
```

`svg-*` variants import their icons from `@quasar/extras` and therefore require the optional `@quasar/extras` package — setup fails with a clear error when it is missing:

```ts
quasar: {
  iconSet: 'svg-mdi-v7',
}
```

When the option is omitted, Quasar's bundled `material-icons` mapping is used automatically and no extra import is emitted.

Font Awesome Pro variants (`fontawesome-v5-pro`, `fontawesome-v6-pro`, `fontawesome-v7-pro`) exist in Quasar but require paid fonts not shipped by `@quasar/extras`; set them up manually via the `css` option and `$q.iconSet.set(...)`.

### Language pack

Select which Quasar Language Pack your components use:

```ts
quasar: {
  lang: 'es',
}
```

The option accepts a single name — Quasar supports exactly one active Language Pack, so arrays, objects, non-strings, the empty string and the `'all'` shorthand are rejected. Unknown names fail at setup time with a did-you-mean suggestion. Valid names are the 71 modern language packs shipped by Quasar (`ar`, `ar-TN`, `az-Latn`, `bg`, `bn`, `bs-BA`, `ca`, `ckb`, `cs`, `da`, `de`, `de-CH`, `de-DE`, `el`, `en-GB`, `en-US`, `eo`, `es`, `et`, `eu`, `fa`, `fa-IR`, `fi`, `fr`, `gn`, `he`, `hi`, `hr`, `hu`, `id`, `is`, `it`, `ja`, `kk`, `km`, `ko-KR`, `lb`, `lt`, `lu`, `lv`, `mk`, `ml`, `ms`, `ms-MY`, `my`, `nb-NO`, `nl`, `pl`, `pt`, `pt-BR`, `ro`, `ru`, `sk`, `sl`, `sm`, `sq`, `sr`, `sr-Cyrl`, `sv`, `ta`, `th`, `tl`, `tr`, `ug`, `uk`, `ur-PK`, `uz-Cyrl`, `uz-Latn`, `vi`, `zh-CN`, `zh-TW`). Language packs are pure JS lookup tables and never require `@quasar/extras`.

When the option is omitted, Quasar's bundled `en-US` pack is used automatically and no extra import is emitted.

Quasar also ships 3 deprecated aliases (`kur-CKB`, `mm`, `sr-CYR`) that re-export the modern names — use the modern names (`ckb`, `my`, `sr-Cyrl`) instead, or set an alias manually via a `Lang.set(...)` boot file.

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

## Development

- Clone the repo: `git clone https://github.com/memotux/nuxt-quasar.git`
- Install dependencies: `pnpm install`
- Generate type stubs: `pnpm dev:prepare`
- Start the [playground](./playground) in dev mode: `pnpm dev`
- Build the playground: `pnpm dev:build` (or `pnpm dev:generate` for SSG)
- Run all tests, including the browser layer: `pnpm test`
- Run the fast layer only (no browser required): `pnpm test:no-browser`
- Run the browser layer only (chromium required): `pnpm test:browser`
- Install the browser for the e2e suite once: `npx playwright install chromium`
  (the suite is chromium-only; Firefox `waitUntil: 'hydration'` is broken upstream, see
  [nuxt/test-utils#1671](https://github.com/nuxt/test-utils/issues/1671))
- Lint: `pnpm lint`
- Type-check: `pnpm test:types`

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-quasar-vite/latest.svg
[npm-version-href]: https://npmjs.com/package/nuxt-quasar-vite
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-quasar-vite.svg
[npm-downloads-href]: https://npmjs.com/package/nuxt-quasar-vite
[license-src]: https://img.shields.io/npm/l/nuxt-quasar-vite.svg
[license-href]: https://npmjs.com/package/nuxt-quasar-vite
