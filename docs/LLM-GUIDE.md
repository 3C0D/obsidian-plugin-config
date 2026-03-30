# LLM Guide — obsidian-plugin-config

## The two distinct roles of this repo

### 1. Local plugin (root)

The root of this repo functions as a **local Obsidian plugin** for development and testing purposes.

- `src/` — reusable code (modals, utils, helpers) that can be tested locally and exported via NPM
- `scripts/` — local build/dev scripts for this repo itself (includes `build-npm.ts` for NPM publishing)
- `package.json` (root) — configuration for this local plugin + NPM package
- `tsconfig.json` (root) — TypeScript config for this local plugin
- `eslint.config.mts` (root) — ESLint config for this local plugin

Exports from `src/` are available as snippets via the NPM package `obsidian-plugin-config`.

### 2. Injection system (templates/)

`templates/` is the **source of truth** for everything injected into target plugins.

- `templates/scripts/` — scripts that will be copied into `<target>/scripts/`
- `templates/package.json` — base deps/scripts merged into `<target>/package.json`
- `templates/package-sass.json` — additional deps merged when `--sass` flag is used
- `templates/tsconfig.json` — TypeScript config injected as `<target>/tsconfig.json`
- `templates/eslint.config.mts` — ESLint config injected into target
- `templates/.editorconfig`, `templates/.prettierrc`, etc. — config files injected into target
- `templates/help-plugin.ts` — help script injected as `<target>/scripts/help.ts`

The injection logic lives in `scripts/inject-core.ts`, `scripts/inject-path.ts`, `scripts/inject-prompt.ts`.

---

## Critical distinction

| | Root | templates/ |
|---|---|---|
| Purpose | Local dev + NPM exports | Source for injection |
| package.json | This repo's own config | Base for target plugins |
| tsconfig.json | This repo's TS config | Injected into targets |
| scripts/ | Local scripts (+ build-npm) | Copied into targets |

**Never modify root config files thinking it will affect injected plugins. Always modify `templates/`.**

**Never read root `package.json` or `tsconfig.json` as a reference for what gets injected.**

---

## What injection does

`inject-core.ts → updatePackageJson()` reads `templates/package.json` (and `templates/package-sass.json` if `--sass`) and merges into the target plugin's `package.json`:
- All `scripts` are overwritten with template values
- All `devDependencies` from template are added/updated
- `engines` and `type` are set from template
- Target plugin's own specific deps are preserved

`inject-core.ts → injectScripts()` copies files from `templates/` into the target:
- `templates/scripts/*` → `<target>/scripts/`
- `templates/tsconfig.json` → `<target>/tsconfig.json`
- `templates/eslint.config.mts` → `<target>/eslint.config.mts`
- `templates/.editorconfig`, `.prettierrc`, `.npmrc`, `.env` → `<target>/`
- `templates/.github/workflows/*` → `<target>/.github/workflows/`

---

## Scripts: local vs injected

Local scripts (`scripts/`) and template scripts (`templates/scripts/`) are **the same scripts**, with one difference:

- `scripts/` has extra files: `inject-core.ts`, `inject-path.ts`, `inject-prompt.ts`, `build-npm.ts`, `update-exports.js`, `update-version-config.ts`
- `templates/scripts/` has only what target plugins need: `esbuild.config.ts`, `acp.ts`, `update-version.ts`, `release.ts`, `utils.ts`, `help.ts`

When updating a shared script (e.g. `acp.ts`), update **both** `scripts/acp.ts` and `templates/scripts/acp.ts`.

---

## What NOT to do

- ❌ Do not add `obsidian-plugin-config` as a dependency in `templates/package.json` — injected plugins are standalone
- ❌ Do not use `../obsidian-plugin-config/scripts/...` paths anywhere — that was the old sibling-repo approach, fully removed
- ❌ Do not hardcode deps/scripts in `inject-core.ts` — they must come from `templates/package.json`
- ❌ Do not modify root `tsconfig.json` or `package.json` to fix issues in injected plugins — fix `templates/` instead
- ❌ Do not run `yarn upgrade` on root and expect it to update what gets injected — versions are defined in `templates/package.json`

---

## obsidian-typings paths (current)

The correct paths for `obsidian-typings` in `tsconfig.json` (confirmed against installed `node_modules`):

```json
"types": ["obsidian-typings"],
"paths": {
  "obsidian-typings/implementations": [
    "./node_modules/obsidian-typings/dist/cjs/implementations.d.cts",
    "./node_modules/obsidian-typings/dist/esm/implementations.mjs"
  ]
}
```

These paths are in `templates/tsconfig.json` and must stay in sync with the actual `obsidian-typings` package structure.

---

## docs/ folder

- `docs/package-ex.json` — example of a real working injected plugin's `package.json` (reference only)
- `docs/tsconfig-ex.json` — example of a real working injected plugin's `tsconfig.json` (reference only)
- `docs/package-versions.json` — archive (reference only, source of truth is `templates/package.json`)
- `docs/package-versions-sass.json` — archive (reference only, source of truth is `templates/package-sass.json`)
- `docs/IMPROVEMENT-PLAN-FOR-LLM.md` — historical task list (may be outdated)
- `docs/LLM-GUIDE.md` — this file
