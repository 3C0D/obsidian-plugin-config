# Notes Techniques

## tslib

**Qu'est-ce que c'est ?**
`tslib` est une bibliothèque runtime pour TypeScript qui contient les helpers TypeScript (comme `__awaiter`, `__extends`, `__spreadArray`, etc.).

**Pourquoi c'est important ?**
Quand tu utilises `"importHelpers": true` dans `tsconfig.json`, TypeScript importe ces helpers depuis tslib au lieu de les dupliquer dans chaque fichier compilé. Ça réduit significativement la taille du bundle.

**Exemple :**
Sans tslib, chaque fichier async duplique le helper `__awaiter` (~200 bytes).
Avec tslib, un seul import : `import { __awaiter } from "tslib"`.

**Version :**
On utilise `"tslib": "2.4.0"` (version stable, pas latest) pour éviter les breaking changes.

## EditorConfig

**Qu'est-ce que c'est ?**
EditorConfig permet de définir des règles de formatage (indentation, line endings, etc.) qui fonctionnent dans tous les éditeurs.

**Fichier injecté :**
`.editorconfig` est automatiquement injecté dans le plugin.

**Pour VSCode :**
L'extension `editorconfig.editorconfig` doit être installée pour que VSCode respecte les règles.

**Recommandations automatiques :**
Le fichier `.vscode/extensions.json` suggère automatiquement les extensions nécessaires :
- `esbenp.prettier-vscode` - Prettier
- `dbaeumer.vscode-eslint` - ESLint
- `editorconfig.editorconfig` - EditorConfig
- `yzhang.markdown-all-in-one` - Markdown

Quand l'utilisateur ouvre le projet, VSCode propose d'installer ces extensions.

## Prettier vs EditorConfig

**EditorConfig** : Règles de base (tabs/spaces, line endings, charset)
**Prettier** : Formatage avancé du code (quotes, semicolons, line width, etc.)

Les deux sont complémentaires. EditorConfig s'applique à tous les fichiers, Prettier se concentre sur le code.
