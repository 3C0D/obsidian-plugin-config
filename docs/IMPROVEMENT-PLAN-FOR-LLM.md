# Instructions for LLM — obsidian-plugin-config v2

## Context

This repo has TWO complementary roles:

1. **Injection system**: copies scripts + configs
   into Obsidian plugin repos via NPM global CLI
2. **Snippet development**: local workspace to
   create/test reusable code (modals, helpers)
   exported via NPM for other plugins to import

**Root**:
`c:\Users\dd200\Documents\Mes_projets\Mes repo obsidian new\obsidian-plugin-config`

---

## Tasks to execute (in order)

### Task 1: Create `scripts/inject-core.ts`

Extract shared logic from `scripts/inject-path.ts`
and `scripts/inject-prompt.ts`.

**Critical**: Simplify `findPluginConfigRoot()`.
Remove ALL sibling directory detection
(`../obsidian-plugin-config`). The function should:
1. Check `import.meta.url` to find the NPM
   package root
2. Fallback to `process.cwd()`
3. Nothing else

Shared functions to extract:
- `InjectionPlan` interface
- `analyzePlugin()`
- `findPluginConfigRoot()` (simplified as above)
- `copyFromLocal()`
- `ensurePluginConfigClean()`
- `showInjectionPlan()`
- `cleanOldScripts()`
- `cleanOldLintFiles()`
- `injectScripts()` — use inject-path version
  (more complete)
- `updatePackageJson()` — use inject-path version
- `analyzeCentralizedImports()`
- `createRequiredDirectories()`
- `createInjectionInfo()`
- `readInjectionInfo()`
- `cleanNpmArtifactsIfNeeded()`
- `ensureTsxInstalled()`
- `runYarnInstall()`
- `performInjection()` — main orchestration

**Remove**: All debug logging (lines with
`CRITICAL DEBUG`, `FINAL CHECK`, `VERIFICATION`).

### Task 2: Simplify `scripts/inject-path.ts`

Keep only:
- CLI argument parsing
- Dry-run display logic
- Call to inject-core functions
- `main()` + script execution

### Task 3: Simplify `scripts/inject-prompt.ts`

Keep only:
- Interactive prompting
- Calls to inject-core functions
- Add SASS support (currently missing)

### Task 4: Fix ESLint configs

**Both root AND template `eslint.config.mts`**:
```diff
-"@typescript-eslint/no-unused-vars": ["warn", { "args": "none" }],
-"@typescript-eslint/ban-ts-comment": "off",
+"@typescript-eslint/no-unused-vars": ["error", { "args": "none", "varsIgnorePattern": "^_" }],
+"@typescript-eslint/ban-ts-comment": "warn",
```

### Task 5: Fix `tsconfig.json` (root)

Remove nonexistent include:
```diff
 "include": [
   "./src/**/*.ts",
-  "./scripts/**/*.ts",
-  "eslint.config.fix.d.ts"
+  "./scripts/**/*.ts"
 ]
```

### Task 5b: Fix `templates/tsconfig.json`

Fix obsidian-typings paths (the root tsconfig
has the correct paths per official docs):
```diff
 "paths": {
   "obsidian-typings/implementations": [
-    "./node_modules/obsidian-typings/dist/cjs/implementations.cts",
-    "./node_modules/obsidian-typings/dist/esm/implementations.mjs"
+    "./node_modules/obsidian-typings/dist/implementations.d.ts",
+    "./node_modules/obsidian-typings/dist/implementations.cjs"
   ]
 }
```

### Task 6: Fix `package.json`

1. **Add prettier**: `"prettier": "^3.4.0"` to
   `devDependencies`

2. **Simplify exports** — replace entire exports:
```json
"exports": {
  ".": "./src/index.ts"
}
```
Remove `./scripts/*`, `./modals`, `./tools`,
`./utils` — the root export covers everything.

3. **Clean duplicate dependencies**:
   Keep in `dependencies` only what the NPM CLI
   needs at runtime:
   - `tsx`, `fs-extra`, `esbuild`, `dotenv`,
     `builtin-modules`, `dedent`, `semver`,
     `@types/node`, `@types/semver`, `typescript`
   Remove from `dependencies` (keep in devDeps):
   - `obsidian`, `obsidian-typings`, `lodash`,
     `@types/lodash`

### Task 7: Remove path aliases from templates

In `templates/scripts/esbuild.config.ts`, **delete
the entire `path-alias` plugin**:
```ts
// DELETE THIS ENTIRE PLUGIN:
{
  name: "path-alias",
  setup: (build) => {
    build.onResolve({ filter: /^@config\// }, ...);
    build.onResolve({ filter: /^@config-scripts\// }, ...);
  }
}
```

Do the same in the root `scripts/esbuild.config.ts`.

### Task 8: Complete injection — add missing files

In `inject-core.ts`, add to `configFiles`:
- `templates/.editorconfig`
- `templates/.prettierrc`
- `templates/.npmrc`
- `templates/.env`
- `templates/.vscode/tasks.json`

Add `prettier` to `requiredDeps` in
`updatePackageJson()`.

### Task 9: Delete obsolete files

- `templates/package-versions.json`
- `templates/package-versions-sass.json`
- `templates/scripts/esbuild.config-sass.ts`

### Task 10: Fix `build-npm.ts`

Replace fragile echo piping:
```diff
-execSync('echo 1 | tsx scripts/update-version-config.ts', ...);
+execSync('tsx scripts/update-version-config.ts', ...);
```

Replace hardcoded `"1.8.9"` with:
```ts
const manifest = JSON.parse(
  fs.readFileSync("manifest.json", "utf8")
);
versions[packageJson.version] =
  manifest.minAppVersion;
```

### Task 11: Translate French comments

All templates — replace French comments with
English. Examples:
```diff
-// Plugin pour gérer les alias de chemin
+// Plugin to handle path aliases
```
(This specific one will be deleted with the
path-alias plugin, but check all files)

### Task 12: Update help scripts

Update `scripts/help.ts` to document the
simplified architecture.

### Task 13: Align root `.vscode/settings.json`

Add formatter settings from template:
```json
{
  "npm.packageManager": "yarn",
  "js/ts.preferences.includePackageJsonAutoImports": "off",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "yzhang.markdown-all-in-one"
  },
  "editor.formatOnSave": true
}
```

### Task 14: Simplify `update-exports.js`

Since exports are simplified to just `"."`,
update-exports should:
1. Still scan `src/` and regenerate `src/index.ts`
2. Set exports to just `{ ".": "./src/index.ts" }`
   (remove the loop that adds per-module exports)

---

## Important constraints

- **Line length**: Max 100 characters per line
- **Language**: All code and comments in English
- **Verification**: After modifications, run:
  - `yarn build` (TypeScript check)
  - `yarn lint` (ESLint check)
- Uses `yarn` — never `npm`
- ESM (`"type": "module"`)
- Templates are NOT linted (`templates/**` ignored)
- Keep `obsidian` and `obsidian-typings` in
  devDependencies for local snippet development
