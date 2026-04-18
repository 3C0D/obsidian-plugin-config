# Modifications Appliquées depuis modifs.md

## ✅ Fichiers Templates Mis à Jour

### tsconfig.json
- Ajout de `"templates"` dans `exclude`

### package.json
- Ajout de `"tslib": "2.4.0"` dans devDependencies
- Version prettier fixée à `"^3.8.1"`

### eslint.config.mts
- Ajout de `"templates/**"` dans ignores

### Nouveaux fichiers créés

#### .prettierignore
```
# Build output
dist/
main.js

# Dependencies
node_modules/
```

#### .gitattributes
```
# On Windows, git defaults to core.autocrlf=true
* text=auto eol=lf
*.ts text eol=lf
*.json text eol=lf
```

#### .vscode/settings.json
```json
{
  "npm.packageManager": "yarn",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "yzhang.markdown-all-in-one"
  },
  "editor.formatOnSave": true
}
```

#### .vscode/tasks.json
- Tâches pour lint, prettier, build
- Tâche "Obsidian Inject"
- Tâche "Cleanup" combinée

### esbuild.config.ts
- Amélioration de la logique de détection in-place vs external
- Détection plus claire du dossier plugins
- Meilleure gestion des prompts pour vault paths

## 📝 Notes

### Extensions VSCode recommandées
Les fichiers .vscode/settings.json suggèrent d'installer :
- `esbenp.prettier-vscode` - Prettier formatter
- `yzhang.markdown-all-in-one` - Markdown formatter
- EditorConfig extension (pour .editorconfig)

### Commandes disponibles après injection
```bash
yarn start          # Install + dev
yarn dev            # Watch mode
yarn build          # Production build
yarn real           # Build to real vault
yarn acp            # Add, commit, push
yarn bacp           # Build + acp
yarn v              # Update version
yarn r              # Release
yarn h              # Help
yarn lint           # ESLint check
yarn lint:fix       # ESLint fix
yarn prettier       # Prettier check
yarn prettier:fix   # Prettier fix
```

### Workflow de développement

#### In-place (dans .obsidian/plugins)
```bash
cd /path/to/vault/.obsidian/plugins/my-plugin
yarn dev
```

#### External (hors vault)
```bash
cd /path/to/my-plugin
# Configure .env avec TEST_VAULT et REAL_VAULT
yarn dev            # Build vers TEST_VAULT
yarn real           # Build vers REAL_VAULT
```

## 🔄 Prochaines étapes

1. Tester l'injection : `yarn inject-prompt`
2. Vérifier dans un plugin test
3. Publier : `yarn npm-publish`
