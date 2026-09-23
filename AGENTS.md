# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

`nuxt-quasar-vite` is a Nuxt module that exposes Quasar Framework UI
components, composables, directives, plugins, and utils to Nuxt 3/4 projects
(Vite-based, SSR supported with Quasar hydration takeover). It is a published
npm library — not an application — so keep changes library-safe: no app-only
assumptions, and respect semver when touching public behavior.

## Repository Layout

- `src/module.ts` — Nuxt module entry: hooks, option resolution, validation.
- `src/internal/` — implementation units (validation, plugin template,
  sass imports, icon sets/languages, animations, Levenshtein did-you-mean,
  etc.), re-exported from `src/internal/index.ts`.
- `test/` — Vitest unit tests, one file per internal unit
  (`test/<unit>.test.ts`).
- `test/helpers/template-fixtures.ts` — single source of truth for
  generated-plugin fixtures shared by template tests. Update it instead of
  re-declaring constants per test file.
- `playground/` — Nuxt app used for manual and integration testing.
- `dist/` — build output (do not edit).

## Commands

```sh
pnpm install        # install dependencies
pnpm dev:prepare    # build module stub + prepare type stubs (run first)
pnpm dev            # run the playground in dev mode
pnpm test           # run all tests (vitest run)
pnpm test:watch     # run tests in watch mode
pnpm test:types     # type-check module and playground (vue-tsc)
pnpm lint           # eslint
```

Build the library with `pnpm prepack` (uses `nuxt-module-build build`).

## Conventions

- Language: TypeScript ESM (`"type": "module"`). Module output is
  `dist/module.mjs`; keep imports ESM-compatible.
- Lint: `@nuxt/eslint-config` via flat config (`eslint.config.mjs`). Run
  `pnpm lint` before finishing work. When lint errors are found, first try
  `pnpm lint --fix`; only if errors remain after that, fix them by editing
  the files manually.
- Tests live in `test/` and use Vitest. When changing code in
  `src/internal/<unit>.ts`, update the matching `test/<unit>.test.ts`.
- Validation errors for user-facing options (plugins, icon sets, icon
  libraries, languages, animations) must include a did-you-mean suggestion
  (see `src/internal/levenshtein.ts` and the validation helpers).
- Docs: user-facing changes to module options or behavior belong in
  `README.md` (English) and, when relevant, `CHANGELOG.md`.
- Commit messages follow Conventional Commits; releases are cut with
  `pnpm release` (changelogen) — never publish without an explicit request.

## Gotchas

- Run `pnpm dev:prepare` after cloning or when generated types are stale,
  otherwise type-check and tests fail with missing `.nuxt` types.
- `quasar` and `sass-embedded` are peer dependencies: the playground provides
  them; never import them as direct dependencies in `src/`.
- The generated plugin (`src/internal/plugin-template.ts`) emits import lines
  in a fixed total order; keep `test/helpers/template-fixtures.ts` in sync
  when changing the template.
- `iconSet`, `iconLibraries`, `lang`, and `plugins` options are validated at
  setup time against typed, curated name lists — extend the lists in
  `src/internal/` and their tests together.
- `console.log` inside a vitest test is swallowed by consola in this setup; use
  `warn`/`error` for in-test observation output.
- The playground consumes the module through `../src/module`, but Nuxt emits the
  `configKey` specifier as the package name (`nuxt-quasar-vite`) into
  `.nuxt/types/modules.d.ts`. `playground/types/nuxt-quasar-vite.d.ts` bridges that
  name to `src/module`; without it the `quasar` key silently falls back to
  `Record<string, any>`. `playground/types/quasar-config-key.ts` guards the typing,
  and `pnpm test:types` now runs the playground stage (and runs in CI).
