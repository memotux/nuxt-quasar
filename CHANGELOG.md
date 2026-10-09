# Changelog

## v1.4.0

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.3.0...v1.4.0)

### 🚀 Enhancements

- **quasar:** Support 2.34+ plugins and composables ([69fde54](https://github.com/memotux/nuxt-quasar/commit/69fde54))

### 📖 Documentation

- **issues:** Publish YAML issue forms ([da0855b](https://github.com/memotux/nuxt-quasar/commit/da0855b))

### ❤️ Contributors

- Romeo Méndez Fuentes ([@memotux](https://github.com/memotux))

## v1.3.0

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.2.1...v1.3.0)

### 🚀 Enhancements

- Validate quasar plugin names at setup time ([245a685](https://github.com/memotux/nuxt-quasar/commit/245a685))
- Add animations option to the quasar config key ([0fcc2e0](https://github.com/memotux/nuxt-quasar/commit/0fcc2e0))
- Add iconLibraries option for typed icon font imports ([a8559ba](https://github.com/memotux/nuxt-quasar/commit/a8559ba))
- Add iconSet option for typed Quasar icon set selection ([6543e87](https://github.com/memotux/nuxt-quasar/commit/6543e87))
- Add lang option for typed Quasar Language Pack selection ([2dcb2f0](https://github.com/memotux/nuxt-quasar/commit/2dcb2f0))
- Generate Quasar name snapshots from installed packages ([b463319](https://github.com/memotux/nuxt-quasar/commit/b463319))

### 🩹 Fixes

- Correct SSR define matrix and add Quasar hydration takeover ([e80e11b](https://github.com/memotux/nuxt-quasar/commit/e80e11b))
- Derive __QUASAR_VERSION__ from installed quasar package ([6462423](https://github.com/memotux/nuxt-quasar/commit/6462423))
- **vite:** Merge user preprocessorOptions instead of clobbering ([f121a87](https://github.com/memotux/nuxt-quasar/commit/f121a87))
- Resolve quasar config-key typing ([a0581a3](https://github.com/memotux/nuxt-quasar/commit/a0581a3))
- Propagate QuasarUIConfiguration type through plugin template ([9b7da64](https://github.com/memotux/nuxt-quasar/commit/9b7da64))
- Align generated config JSON and clear lint/roadmap debt ([a3c37f2](https://github.com/memotux/nuxt-quasar/commit/a3c37f2))
- Dedupe defu-merged plugins option to prevent duplicate import specifier ([b76766c](https://github.com/memotux/nuxt-quasar/commit/b76766c))
- **validation:** Guard nearestSuggestion against empty validList ([e8e4138](https://github.com/memotux/nuxt-quasar/commit/e8e4138))
- **plugin:** Make the generated Quasar plugin type-clean ([25ea175](https://github.com/memotux/nuxt-quasar/commit/25ea175))
- **types:** Type the quasar config key in the playground ([11e8698](https://github.com/memotux/nuxt-quasar/commit/11e8698))

### 💅 Refactors

- Optimize barrel exports, remove dead re-validation, use buildAnimationImports ([9c882a2](https://github.com/memotux/nuxt-quasar/commit/9c882a2))
- Extract shared validation helpers (DRY) ([83b0587](https://github.com/memotux/nuxt-quasar/commit/83b0587))
- Extract shared test fixtures and constants (DRY) ([882ff1a](https://github.com/memotux/nuxt-quasar/commit/882ff1a))
- **module:** Extract @quasar/extras guard into tested helpers ([25cd347](https://github.com/memotux/nuxt-quasar/commit/25cd347))

### 📖 Documentation

- Rewrite README with verified facts ([7bea4d9](https://github.com/memotux/nuxt-quasar/commit/7bea4d9))
- Add AGENTS.md with agent guidance for repo layout, commands, and lint fix order ([d19f8e1](https://github.com/memotux/nuxt-quasar/commit/d19f8e1))
- Attribute the vitest --exclude claim and record the consola gotcha ([f5ba699](https://github.com/memotux/nuxt-quasar/commit/f5ba699))
- **validation:** Tighten the empty-list guard comment ([f3ee3d3](https://github.com/memotux/nuxt-quasar/commit/f3ee3d3))

### 🏡 Chore

- Ignore local harness directories (.pi/, openspec/) ([2519e42](https://github.com/memotux/nuxt-quasar/commit/2519e42))
- Remove dead .eslintrc, widen eslint project scope, ignore local codegraph index ([989d128](https://github.com/memotux/nuxt-quasar/commit/989d128))
- Add antfu/skills locally, update .gitignore ([a2f1cdc](https://github.com/memotux/nuxt-quasar/commit/a2f1cdc))
- Ignore local odd/ planning directory ([87ee8bc](https://github.com/memotux/nuxt-quasar/commit/87ee8bc))

### ✅ Tests

- Add unit coverage for module hooks and defines (JD F7) ([928c373](https://github.com/memotux/nuxt-quasar/commit/928c373))
- Remove duplicated plugin-template assertions and add total-order test ([7b2f0c6](https://github.com/memotux/nuxt-quasar/commit/7b2f0c6))
- Remove subsumed assertions and pin exact config serialization ([c953516](https://github.com/memotux/nuxt-quasar/commit/c953516))
- Pin the exact generated plugin with an inline snapshot ([57b0851](https://github.com/memotux/nuxt-quasar/commit/57b0851))
- Restore coverage for the empty animations array boundary ([c4645a0](https://github.com/memotux/nuxt-quasar/commit/c4645a0))
- Cover module derive and validation helpers directly ([d2e6969](https://github.com/memotux/nuxt-quasar/commit/d2e6969))
- **e2e:** Add minimal Nuxt fixtures for wiring assertions ([ad1b36e](https://github.com/memotux/nuxt-quasar/commit/ad1b36e))
- **e2e:** Render real Quasar components in fixture SSR output ([015ab06](https://github.com/memotux/nuxt-quasar/commit/015ab06))
- Replace path-fragment counts with parsed import assertions ([9812e8b](https://github.com/memotux/nuxt-quasar/commit/9812e8b))
- Replace extras fragment counts with parsed side-effect imports ([07c44d5](https://github.com/memotux/nuxt-quasar/commit/07c44d5))
- **e2e:** Cover hydration takeover and client interactivity with chromium ([6919989](https://github.com/memotux/nuxt-quasar/commit/6919989))
- **e2e:** Fix type errors in browser-hydration collector and screen probe ([2c671b5](https://github.com/memotux/nuxt-quasar/commit/2c671b5))
- Cover lang/iconSet runtime effect and animations 'all' composition ([c407e3c](https://github.com/memotux/nuxt-quasar/commit/c407e3c))
- Fail drift guards loudly instead of skipping ([056b39a](https://github.com/memotux/nuxt-quasar/commit/056b39a))
- Guard the CI test-layer partition ([ae522ea](https://github.com/memotux/nuxt-quasar/commit/ae522ea))
- **drift:** Classify guard failures and restore JSON import attributes ([5d1ea4d](https://github.com/memotux/nuxt-quasar/commit/5d1ea4d))
- **fixtures:** Correct the isolation claim and pin import line shape ([04b5bdd](https://github.com/memotux/nuxt-quasar/commit/04b5bdd))
- Assert the CI browser layer is non-empty ([670474a](https://github.com/memotux/nuxt-quasar/commit/670474a))

### 🤖 CI

- Split the test layer so the browser job installs chromium ([bb4d149](https://github.com/memotux/nuxt-quasar/commit/bb4d149))
- Cancel superseded runs for pull requests ([6923241](https://github.com/memotux/nuxt-quasar/commit/6923241))
- Key the playwright cache on the installed version ([e6c43bf](https://github.com/memotux/nuxt-quasar/commit/e6c43bf))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.2.1

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.2.0...v1.2.1)

### 🏡 Chore

- Upgrade package dependencies ([13d9057](https://github.com/memotux/nuxt-quasar/commit/13d9057))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.2.0

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.1.6...v1.2.0)

### 🏡 Chore

- UPGRADE package dependencies ([eb468f3](https://github.com/memotux/nuxt-quasar/commit/eb468f3))
- DEPRECATED vite:extendConfig hook ([be6a4ff](https://github.com/memotux/nuxt-quasar/commit/be6a4ff))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.1.6

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.1.5...v1.1.6)

## v1.1.5

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.1.4...v1.1.5)

### 🩹 Fixes

- **plugin:** Nuxt HMR import bug ([06b80f2](https://github.com/memotux/nuxt-quasar/commit/06b80f2))

### 🏡 Chore

- **plugin:** Define nuxt plugin as object ([1949103](https://github.com/memotux/nuxt-quasar/commit/1949103))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.1.4

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.1.3...v1.1.4)

### 🩹 Fixes

- **plugin:** Undo commit 566416c2 ([0f6afc8](https://github.com/memotux/nuxt-quasar/commit/0f6afc8))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.1.3

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.1.2...v1.1.3)

### 🩹 Fixes

- Lint errors ([ea91f8b](https://github.com/memotux/nuxt-quasar/commit/ea91f8b))
- Github workflow failed test ([b5b4921](https://github.com/memotux/nuxt-quasar/commit/b5b4921))
- **bug:** Duplicated import on nuxt HMR ([566416c](https://github.com/memotux/nuxt-quasar/commit/566416c))

### 🏡 Chore

- Update package script realease ([315d3fc](https://github.com/memotux/nuxt-quasar/commit/315d3fc))
- Add package script 'dev:generate' ([9c0ba18](https://github.com/memotux/nuxt-quasar/commit/9c0ba18))
- Add test ([3cbf74c](https://github.com/memotux/nuxt-quasar/commit/3cbf74c))
- Update github workflow ([76356a4](https://github.com/memotux/nuxt-quasar/commit/76356a4))
- Upgrade package dependencies ([e17afa5](https://github.com/memotux/nuxt-quasar/commit/e17afa5))
- Update tsconfig ([6a892fb](https://github.com/memotux/nuxt-quasar/commit/6a892fb))
- **plugin:** Use import.meta.server instead of process.server ([cd934c1](https://github.com/memotux/nuxt-quasar/commit/cd934c1))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.1.2

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.1.1...v1.1.2)

### 🏡 Chore

- Cleanup package dependecies ([4f9c00e](https://github.com/memotux/nuxt-quasar/commit/4f9c00e))
- Package script release changelogen bump ([c2cb369](https://github.com/memotux/nuxt-quasar/commit/c2cb369))
- Upgrade packages dependencies & module template ([9d8b764](https://github.com/memotux/nuxt-quasar/commit/9d8b764))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.1.1

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.1.0...v1.1.1)

### 🏡 Chore

- Upgrade packages NUXT 3.15 ([8acb91b](https://github.com/memotux/nuxt-quasar/commit/8acb91b))
- **playground:** Cleanup ([fbffaa1](https://github.com/memotux/nuxt-quasar/commit/fbffaa1))
- **playground:** Upgrade package dependencies ([73651f6](https://github.com/memotux/nuxt-quasar/commit/73651f6))
- Upgrade package dependencies ([0b3de62](https://github.com/memotux/nuxt-quasar/commit/0b3de62))
- Update components:dirs resolvePath ([921805c](https://github.com/memotux/nuxt-quasar/commit/921805c))
- Refactor config css preprocessors options ([1b8dfe0](https://github.com/memotux/nuxt-quasar/commit/1b8dfe0))
- **playground:** Upgrade package dependencies ([0e2478d](https://github.com/memotux/nuxt-quasar/commit/0e2478d))
- Eslint complience ([6217d00](https://github.com/memotux/nuxt-quasar/commit/6217d00))
- ResolvePath quasar src ([a526324](https://github.com/memotux/nuxt-quasar/commit/a526324))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.1.0

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.0.14...v1.1.0)

### 🚀 Enhancements

- SASS 1.80+ suppress deprecation warnings ([0afcb39](https://github.com/memotux/nuxt-quasar/commit/0afcb39))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.0.14

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.0.13...v1.0.14)

- Upgrade to NUXT 3.11
- [Fix] Not resolve import for lang & icon-set

## v1.0.13

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.0.12...v1.0.13)

- Upgrade to NUXT 3.9

## v1.0.12

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.0.10...v1.0.12)

- Quasar SASS Variables and Custom variables are now imported in every SASS/SCSS file.
- Option `quasar.css` file list are inserted on module plugin template, NOT in `nuxt.config.css`.

### 🏡 Chore

- **release:** V1.0.11 ([55fdf1d](https://github.com/memotux/nuxt-quasar/commit/55fdf1d))

### ❤️ Contributors

- MemoTux <romeo@mendezfuentes.net>

## v1.0.11

[compare changes](https://github.com/memotux/nuxt-quasar/compare/v1.0.10...v1.0.11)
