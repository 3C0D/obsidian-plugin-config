# Comment fonctionne SCSS dans cette config

Ce document explique de bout en bout comment un fichier `.scss` est détecté, compilé puis copié dans le dossier `plugins` d'Obsidian, en s'appuyant sur le code du dépôt.

> Remarque : la configuration SCSS n'est pas activée dans `obsidian-plugin-config` lui-même. Elle est définie dans les **templates** qui sont copiés dans chaque plugin Obsidian lors de l'injection (`yarn inject` / `obsidian-inject`). Tout le code cité ci-dessous vit donc dans `templates/scripts/`.

---

## 1. Vue d'ensemble du flux

```
src/styles.scss
      │
      │  détection (esbuild.config.ts → main())
      ▼
entryPoints = [src/main.ts, src/styles.scss]
      │
      │  esbuild.context() + sassPlugin() (esbuild.config.ts → createBuildContext)
      ▼
buildPath/<id>/
  ├── main.js
  └── main.css        ← produit par esbuild-sass-plugin
      │
      │  plugin "remove-main-css" (esbuild.config.ts) → utils.removeMainCss
      │  + plugin "copy-to-plugins-folder" (esbuild.config.ts) → utils.copyFilesToTargetDir
      ▼
buildPath/<id>/
  ├── manifest.json   (copié)
  ├── main.js
  └── styles.css      ← renommé depuis main.css ? non : voir point 3
```

Les deux moments clés sont :

1. **Détection et compilation** dans `templates/scripts/esbuild.config.ts`.
2. **Nettoyage et copie vers le dossier plugins** via les fonctions utilitaires de `templates/scripts/utils.ts`.

---

## 2. Où passe le fichier SCSS

### 2.1 Détection du fichier SCSS

Dans `templates/scripts/esbuild.config.ts`, fonction `main()` (lignes 115-140) :

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

- Le fichier SCSS est donc attendu à `src/styles.scss` (priorité maximale).
- Sinon, fallback sur `src/styles.css` puis `styles.css` à la racine.
- `scssExists` (booléen) sert ensuite à activer ou non le plugin SASS dans esbuild.

### 2.2 Compilation via esbuild + sassPlugin

Toujours dans `templates/scripts/esbuild.config.ts`, fonction `createBuildContext()` (lignes 33-69) :

```ts
const plugins = [
  // Add SASS plugin if SCSS files are detected
  ...(hasSass
    ? [
        await (async () => {
          try {
            // @ts-expect-error - esbuild-sass-plugin is installed during injection
            const { sassPlugin } = await import('esbuild-sass-plugin');
            return sassPlugin({
              syntax: 'scss',
              style: 'expanded'
            });
          } catch (error) {
            console.warn(
              '⚠️  esbuild-sass-plugin not found. Install it with: yarn add -D esbuild-sass-plugin'
            );
            throw error;
          }
        })(),
        {
          name: 'remove-main-css',
          setup(build: esbuild.PluginBuild): void {
            build.onEnd(async (result) => {
              if (result.errors.length === 0) {
                await removeMainCss(buildPath);
              }
            });
          }
        }
      ]
    : []),
```

- Le `sassPlugin` n'est importé que si `hasSass` est `true` (donc si `src/styles.scss` existe).
- Il est configuré en syntaxe `scss` et style `expanded` (non minifié, lisible).
- esbuild produit un fichier `main.css` à côté de `main.js` dans `outdir` (= `buildPath`).
- Un second plugin esbuild interne, `remove-main-css`, supprime ce `main.css` à la fin du build (voir 3.1).

### 2.3 Dépendance : `esbuild-sass-plugin`

- Import dynamique, donc l'installation de la dépendance n'est pas obligatoire pour les plugins qui n'utilisent pas SCSS.
- Le code affiche un warning et échoue si SCSS est détecté mais que le plugin n'est pas installé :

  > `⚠️  esbuild-sass-plugin not found. Install it with: yarn add -D esbuild-sass-plugin`

- Côté utilisateur, la doc le précise : `README.md`, section **SASS Support** (lignes 85-96).

---

## 3. Comment c'est copié dans le dossier plugins

### 3.1 Nettoyage du `main.css` parasite

Dans `templates/scripts/utils.ts`, fonction `removeMainCss()` (lignes 169-180) :

```ts
export async function removeMainCss(outdir: string): Promise<void> {
  const mainCssPath = path.join(outdir, 'main.css');
  try {
    await rm(mainCssPath);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(
        `Warning: Could not remove main.css: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
```

Pourquoi ? Le `sassPlugin` d'esbuild génère un fichier `main.css` parce qu'il hérite du `name` (`main`) de l'entry point. Or Obsidian attend `styles.css` dans le dossier du plugin. `removeMainCss` supprime donc ce fichier temporaire immédiatement après chaque build (uniquement si le build n'a pas d'erreur, cf. `if (result.errors.length === 0)` dans `esbuild.config.ts`).

### 3.2 Copie vers le dossier plugins

Dans `templates/scripts/utils.ts`, fonction `copyFilesToTargetDir()` (lignes 74-123) :

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

> Note importante : `copyFilesToTargetDir` ne copie **que** `manifest.json` et un éventuel `styles.css` / `styles.css` racine. Le `main.css` généré par esbuild-sass-plugin est supprimé à l'étape précédente (3.1).

### 3.3 Branchement sur le cycle de vie esbuild

Toujours dans `templates/scripts/esbuild.config.ts`, le plugin `copy-to-plugins-folder` (lignes 70-94) déclenche la copie après chaque build :

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

- Mode **dev (`yarn dev`)** : après chaque rebuild (watch), `copyFilesToTargetDir` recopie manifest + CSS vers le vault de test.
- Mode **build prod (`yarn build`)** : rien n'est copié par défaut, sauf si on passe `-r` / `real` (=> copie vers le vault de prod + reload Obsidian).

### 3.4 Cible : `buildPath`

`buildPath` est calculé par `env.ts` (`getBuildPath`) à partir de `.env` (`TEST_VAULT` / `REAL_VAULT`) ou du dossier courant (développement in-place). Il pointe vers :

```
<vault>/.obsidian/plugins/<pluginId>/
```

Donc concrètement, le résultat final pour le SCSS est :

1. `src/styles.scss` → compilé par esbuild-sass-plugin → `buildPath/main.css` (transitoire)
2. `main.css` renommé en `styles.css` par `renameMainCss`
3. Le CSS est directement disponible et référencé via `manifest.json` (`"css": "styles.css"`).

> 💡 Le `styles.css` final est produit automatiquement par ce pipeline en renommant le fichier `main.css` issu de la compilation SCSS. Aucun fichier source `styles.css` n'est nécessaire à la racine si vous utilisez exclusivement du SCSS.

---

## 4. Où l'injecteur installe tout ça dans le plugin cible

L'injection des templates se fait dans `scripts/inject-core.ts`, fonction `injectScripts()` (lignes 455-612). Le tableau `scriptFiles` (lignes 469-480) liste explicitement les fichiers copiés dans le dossier `scripts/` du plugin cible :

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

Donc après injection, le plugin Obsidian cible contient `scripts/esbuild.config.ts` (avec la logique SCSS) et `scripts/utils.ts` (avec `removeMainCss` et `copyFilesToTargetDir`).

Le `.gitignore` injecté (`templates/gitignore.template`, ligne 25-26) ignore explicitement le fichier intermédiaire :

```
# scss result
main.css
```

---

## 5. Récapitulatif des fichiers clés

| Rôle | Fichier | Fonctions / lignes |
|------|---------|--------------------|
| Détection SCSS + build esbuild | `templates/scripts/esbuild.config.ts` | `main()` ~l. 115-140, `createBuildContext()` ~l. 33-69 |
| Plugin esbuild pour compiler SCSS | `esbuild-sass-plugin` (importé dynamiquement) | `esbuild.config.ts` ~l. 41-58 |
| Suppression du `main.css` transitoire | `templates/scripts/utils.ts` | `removeMainCss()` ~l. 169-180 |
| Copie finale vers le dossier plugins | `templates/scripts/utils.ts` | `copyFilesToTargetDir()` ~l. 74-123 |
| Branchement sur `onEnd` esbuild | `templates/scripts/esbuild.config.ts` | plugin `copy-to-plugins-folder` ~l. 70-94 |
| Copie des templates vers le plugin cible | `scripts/inject-core.ts` | `injectScripts()` ~l. 455-612, `buildFileList()` ~l. 284-353 |
| Dépendance optionnelle | `esbuild-sass-plugin` (ajoutée par l'utilisateur si SCSS) | `README.md` § SASS Support, ~l. 85-96 |
| Ignore du fichier transitoire | `templates/gitignore.template` | `main.css` ligne 25-26 |
