# How SCSS Works in this Config

This document explains end-to-end how a `.scss` file is detected, compiled, and then copied into the Obsidian `plugins` folder, based on the repository's code.

> Note: SCSS configuration is not enabled in `obsidian-plugin-config` itself. It is defined in the **templates** that are copied into each Obsidian plugin during injection (`yarn inject` / `obsidian-inject`). All the code cited below resides in `templates/scripts/`.

---

## 1. Flow Overview

```
src/styles.scss
      │
      │  detection (esbuild.config.ts → main())
      ▼
entryPoints = [src/main.ts, src/styles.scss]
      │
      │  esbuild.context() + sassPlugin() (esbuild.config.ts → createBuildContext)
      │  outbase: src/ → styles.scss → styles.css (name derived from entry, not main.ts)
      ▼
buildPath/
  ├── main.js
  └── styles.css      ← produced directly by esbuild+sassPlugin
      │
      │  plugin "rename-main-css" → utils.renameMainCss (no-op safety net: main.css does not exist)
      │  plugin "copy-to-plugins-folder" → utils.copyFilesToTargetDir (manifest only if SCSS)
      ▼
buildPath/
  ├── manifest.json   (copied)
  ├── main.js
  └── styles.css      ← already in place, no renaming necessary
```

The two key moments are:

1. **Detection and compilation** in `templates/scripts/esbuild.config.ts`.
2. **Cleanup and copying to the plugins folder** via utility functions in `templates/scripts/utils.ts`.

---

## 2. SCSS File Path

### 2.1 SCSS File Detection

In `templates/scripts/esbuild.config.ts`, `main()` function:

```ts
// Check for SCSS first, then CSS in src, then in root
const srcStylesScssPath = path.join(pluginDir, 'src/styles.scss');
const srcStylesPath    = path.join(pluginDir, 'src/styles.css');
const rootStylesPath   = path.join(pluginDir, 'styles.css');

const scssExists = await isValidPath(srcStylesScssPath);
const stylePath = scssExists
  ? srcStylesScssPath
  : (await isValidPath(srcStylesPath))
    ? srcStylesPath
    : (await isValidPath(rootStylesPath))
      ? rootStylesPath
      : '';

const mainTsPath = path.join(pluginDir, 'src/main.ts');
const entryPoints = stylePath ? [mainTsPath, stylePath] : [mainTsPath];
const context = await createBuildContext(buildPath, isProd, entryPoints, scssExists);
```

- The SCSS file is expected at `src/styles.scss` (highest priority).
- Otherwise, it falls back to `src/styles.css` then `styles.css` at the root.
- `scssExists` (boolean) is then used to enable or disable the SASS plugin in esbuild.

### 2.2 Compilation via esbuild + sassPlugin

Also in `templates/scripts/esbuild.config.ts`, `createBuildContext()` function:

```ts
const plugins = [
  ...(hasSass
    ? [
        await (async () => {
          // @ts-expect-error - esbuild-sass-plugin is installed during injection
          const { sassPlugin } = await import('esbuild-sass-plugin');
          return sassPlugin({ syntax: 'scss', style: 'expanded' });
        })(),
        {
          name: 'rename-main-css',
          setup(build: esbuild.PluginBuild): void {
            build.onEnd(async (result) => {
              if (result.errors.length === 0) {
                await renameMainCss(buildPath);
              }
            });
          }
        }
      ]
    : []),
```

- The `sassPlugin` is only imported if `hasSass` is `true`.
- It is configured with `scss` syntax and `expanded` style (not minified on the Sass side; esbuild applies its own minification if `isProd = true`).
- **Output filename**: esbuild derives the name from the entry point. With `outbase: src/` and entry `src/styles.scss`, the relative path is `styles.scss` → output `buildPath/styles.css`. The name `main.ts` does not interfere.
- The `rename-main-css` plugin is a **safety net**: in the current configuration, `buildPath/main.css` is never created, so `renameMainCss` is a no-op. It protects against future changes in sassPlugin behavior.

### 2.3 Dependency: `esbuild-sass-plugin`

Dynamic import: installation is not mandatory for plugins without SCSS. If SCSS is detected but the plugin is missing:

> `⚠️  esbuild-sass-plugin not found. Install it with: yarn add -D esbuild-sass-plugin`

> **Note**: the `.sass` extension (indented syntax) is not supported. Only `.scss` is detected and compiled.

---

## 3. How it is Copied to the Plugins Folder

### 3.1 `renameMainCss` — Safety Net (no-op in current SCSS flow)

In `templates/scripts/utils.ts`, `renameMainCss()` function:

```ts
export async function renameMainCss(outdir: string): Promise<void> {
  const mainCssPath = path.join(outdir, 'main.css');
  const stylesCssPath = path.join(outdir, 'styles.css');
  try {
    if (await isValidPath(mainCssPath)) {
      await rename(mainCssPath, stylesCssPath);
    }
  } catch (error: unknown) {
    console.warn(`Warning: Could not rename main.css to styles.css: ...`);
  }
}
```

With `outbase: src/` and entry `src/styles.scss`, esbuild directly produces `buildPath/styles.css`. `buildPath/main.css` is therefore never created, and the `if (await isValidPath(mainCssPath))` check is always false. This function remains as a safeguard if sassPlugin behavior evolves.

> **Context of `_.._`**: for the root CSS case (`styles.css` outside `outbase: src/`), esbuild encodes `../styles.css` as `_.._/styles.css`. This is not related to SCSS. `copyFilesToTargetDir` handles this case separately (manual copy + removal of `_.._/`).

### 3.2 Copying to the Plugins Folder

In `templates/scripts/utils.ts`, `copyFilesToTargetDir()` function:

```ts
export async function copyFilesToTargetDir(buildPath: string): Promise<void> {
  const pluginDir = process.cwd();
  const manifestSrc  = path.join(pluginDir, 'manifest.json');
  const manifestDest = path.join(buildPath, 'manifest.json');
  const cssDest      = path.join(buildPath, 'styles.css');
  const folderToRemove = path.join(buildPath, '_.._');
  ...
  // Copy CSS
  try {
    const srcStylesPath  = path.join(pluginDir, 'src/styles.css');
    const rootStylesPath = path.join(pluginDir, 'styles.css');

    if (await isValidPath(srcStylesPath)) {
      await copyFile(srcStylesPath, cssDest);
    }
    else if (await isValidPath(rootStylesPath)) {
      await copyFile(rootStylesPath, cssDest);
      if (await isValidPath(folderToRemove)) {
        await rm(folderToRemove, { recursive: true });
      }
    } else {
      return;
    }
  } ...
}
```

> Important Note: `copyFilesToTargetDir` only copies `manifest.json` and any potential `styles.css` at the root. The `main.css` generated by esbuild-sass-plugin is renamed to `styles.css` in the previous step (3.1).

### 3.3 Integration into the esbuild Lifecycle

Also in `templates/scripts/esbuild.config.ts`, the `copy-to-plugins-folder` plugin triggers copying after each build:

```ts
{
  name: 'copy-to-plugins-folder',
  setup: (build: esbuild.PluginBuild): void => {
    build.onEnd(async () => {
      if (isProd) {
        if (process.argv.includes('-r') || process.argv.includes('real')) {
          await copyFilesToTargetDir(buildPath);
          console.log(`Successfully installed in ${buildPath}`);
          await reloadObsidian();
        } else {
          const folderToRemove = path.join(buildPath, '_.._');
          if (await isValidPath(folderToRemove)) {
            await rm(folderToRemove, { recursive: true });
          }
          console.log('Build done in initial folder');
        }
      } else {
        // watch (dev)
        await copyFilesToTargetDir(buildPath);
      }
    });
  }
}
```

- **Dev mode (`yarn dev`)**: after each rebuild (watch), `copyFilesToTargetDir` recopies the manifest + CSS to the test vault.
- **Prod build mode (`yarn build`)**: nothing is copied by default, unless `-r` / `real` is passed (=> copy to production vault + reload Obsidian).

### 3.4 Target: `buildPath`

`buildPath` is calculated by `env.ts` (`getBuildPath`) from `.env` (`TEST_VAULT` / `REAL_VAULT`) or the current directory (in-place development). It points to:

```
<vault>/.obsidian/plugins/<pluginId>/
```

So concretely, the final result for SCSS is:

1. `src/styles.scss` → compiled by esbuild-sass-plugin → `buildPath/main.css` (transient)
2. `main.css` renamed to `styles.css` by `renameMainCss`
3. The CSS is directly available and referenced via `manifest.json` (`"css": "styles.css"`).

> 💡 The final `styles.css` is automatically produced by this pipeline by renaming the `main.css` file from the SCSS compilation. No root `styles.css` source file is necessary if you use SCSS exclusively.

---

## 4. Where the Injector Installs Everything in the Target Plugin

Template injection happens in `scripts/inject-core.ts`, `injectScripts()` function. The `scriptFiles` array explicitly lists files copied into the target plugin's `scripts/` folder:

```ts
const scriptFiles = [
  'templates/scripts/utils.ts',
  'templates/scripts/esbuild.config.ts',
  'templates/scripts/acp.ts',
  'templates/scripts/update-version.ts',
  'templates/scripts/release.ts',
  'templates/scripts/help.ts',
  'templates/scripts/constants.ts',
  'templates/scripts/env.ts',
  'templates/scripts/reload.ts',
  'templates/scripts/typingsPlugin.ts'
];
```

So after injection, the target Obsidian plugin contains `scripts/esbuild.config.ts` (with SCSS logic) and `scripts/utils.ts` (with `renameMainCss` and `copyFilesToTargetDir`).

The injected `.gitignore` (`templates/gitignore.template`) explicitly ignores the intermediate file:

```
# scss result
main.css
```

---

## 5. Key Files Summary

| Role                                                                 | File                                          | Functions / Lines                    |
| -------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------ |
| SCSS detection + esbuild build                                       | `templates/scripts/esbuild.config.ts`         | `main()`, `createBuildContext()`     |
| esbuild plugin to compile SCSS                                       | `esbuild-sass-plugin` (dynamically imported)  | `esbuild.config.ts`                  |
| Safety net (no-op SCSS): rename `main.css` → `styles.css` if present | `templates/scripts/utils.ts`                  | `renameMainCss()`                    |
| Final copy to plugins folder                                         | `templates/scripts/utils.ts`                  | `copyFilesToTargetDir()`             |
| Hook into esbuild `onEnd`                                            | `templates/scripts/esbuild.config.ts`         | `copy-to-plugins-folder` plugin      |
| Copy templates to target plugin                                      | `scripts/inject-core.ts`                      | `injectScripts()`, `buildFileList()` |
| Optional dependency                                                  | `esbuild-sass-plugin` (added by user if SCSS) | `README.md` § SASS Support           |
| Ignore transient file                                                | `templates/gitignore.template`                | `main.css`                           |

---

## 6. Scenario Coverage

| Scenario                             | `buildPath`                       | CSS produced by esbuild | In place after build? |
| ------------------------------------ | --------------------------------- | ----------------------- | --------------------- |
| Watch, in-place (pluginDir in vault) | `pluginDir`                       | `pluginDir/styles.css`  | ✅ direct              |
| Watch, external → TEST_VAULT         | `<vault>/.obsidian/plugins/<id>/` | `buildPath/styles.css`  | ✅ direct              |
| Prod + `-r`, external → REAL_VAULT   | `<vault>/.obsidian/plugins/<id>/` | `buildPath/styles.css`  | ✅ direct              |
| Prod, initial folder (`yarn build`)  | `pluginDir`                       | `pluginDir/styles.css`  | ✅ direct              |
| Release (GH Actions, `yarn build`)   | `pluginDir` (no vault)            | `pluginDir/styles.css`  | ✅ direct              |

In all SCSS scenarios, `copyFilesToTargetDir` does not find a source CSS file (`src/styles.css` absent, no root `styles.css`) and returns early — the CSS is already in `buildPath` directly produced by esbuild. Only `manifest.json` is copied by this function in the SCSS case.
