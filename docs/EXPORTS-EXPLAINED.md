# NPM Exports — How it works

## The two roles of this repo

### 1. Injection system (primary)

The injection system copies scripts and config files
**directly into target plugins**. After injection,
the plugin is **100% standalone**.

```
templates/ → target-plugin/
  scripts/utils.ts     → scripts/utils.ts
  scripts/esbuild...   → scripts/esbuild...
  tsconfig.json        → tsconfig.json
  .gitignore           → .gitignore
  ...
```

### 2. Exportable snippets (complementary)

The `src/` directory contains reusable code
(modals, helpers, utilities) that can be imported
by other plugins via the NPM package.

**These two systems are complementary, not opposed.**
Injection provides the base infrastructure.
Exports provide optional reusable components.

---

## How NPM exports work

The `exports` field in `package.json`:
```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

This single entry is enough. `src/index.ts`
re-exports everything from all submodules.

### Importing in another plugin

```ts
// Import what you need
import {
  showConfirmModal,
  NoticeHelper,
  SettingsHelper
} from "obsidian-plugin-config";
```

That's it. One import path covers everything.

### What `update-exports` does

Running `yarn update-exports` (or `yarn ue`):

1. **Scans `src/` subdirectories** for folders
   containing an `index.ts` file
2. **Regenerates `src/index.ts`** with
   `export * from` for each found module
3. **Updates `package.json` `exports`** field

Example: Adding `src/components/index.ts` and
running `update-exports` will add:
```ts
// In src/index.ts:
export * from './components/index.js';
```

---

## Local development

This repo also works as an Obsidian plugin for
testing purposes. The `src/main.ts` loads a
sample plugin that exercises the exportable code.

### Why keep obsidian + obsidian-typings locally?

The snippets in `src/` use Obsidian's API (modals,
settings, notices). To develop and test these
snippets, you need the Obsidian types available.

You can:
- Run `yarn build` to check for type errors
- Run `yarn dev` to test in a vault
- **Never** release this as a real plugin

### Workflow for adding new snippets

1. Create your module in `src/mymodule/`
2. Add an `index.ts` that exports everything
3. Run `yarn update-exports` to update the barrel
4. Test locally with `yarn dev`
5. When ready, publish via `yarn npm-publish`

---

## Injection scripts explained

### `inject-path.ts` — Direct injection

Options:
- `--yes` / `-y` : Skip confirmation
- `--sass` : Include SASS support
- `--dry-run` / `--check` : Preview only

### `inject-prompt.ts` — Interactive injection

Prompts for target path and confirmation.

### `obsidian-inject` CLI (global)

```bash
npm install -g obsidian-plugin-config
obsidian-inject                     # Current dir
obsidian-inject ../my-plugin        # By path
obsidian-inject ../my-plugin --sass # With SASS
```

### `build-npm.ts` — NPM publish workflow

Automates: version → commit → push → exports →
bin → publish.

> **Tip**: Run `npm login` first, or visit
> https://www.npmjs.com/ to get your auth token.

### `update-exports.js` — Refresh exports

Scans `src/` and regenerates `src/index.ts` and
the `exports` field in `package.json`.

---

## SASS support

The template `esbuild.config.ts` handles SASS
automatically via dynamic import:
```ts
const { sassPlugin } =
  await import('esbuild-sass-plugin');
```

If `.scss` files are detected in `src/`, the SASS
plugin is loaded. If not installed, it warns you.

The `--sass` injection flag adds
`esbuild-sass-plugin` to the target's dependencies.

---

## Svelte support (planned)

Not yet implemented. Would require:
- `esbuild-svelte` package
- `svelte` compiler
- Detection of `.svelte` files in esbuild config
