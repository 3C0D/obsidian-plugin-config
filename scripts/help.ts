#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Aide Rapide
Système d'injection pour plugins Obsidian autonomes

═══════════════════════════════════════════════════════════════════

📋 COMMANDES PRINCIPALES

INJECTION:
  yarn inject <chemin> --yes      # Injection automatique
  yarn inject-prompt <chemin>     # Injection avec prompts
  yarn check-plugin <chemin>      # Vérification sans injection

DÉVELOPPEMENT:
  yarn acp                        # Add, commit, push (avec Git sync)
  yarn bacp                       # Build + add, commit, push
  yarn v, update-version          # Mise à jour version
  yarn release, r                 # Release GitHub avec tag
  yarn build-npm                  # Build package NPM
  yarn lint, lint:fix             # ESLint vérification/correction
  yarn run help, h                # Cette aide

═══════════════════════════════════════════════════════════════════

🔧 INJECTION LOCALE

Structure recommandée:
  mes-plugins/
  ├── obsidian-plugin-config/     # Ce repo
  ├── mon-plugin-1/
  └── mon-plugin-2/

Utilisation:
  yarn inject ../mon-plugin --yes
  yarn check-plugin ../mon-plugin  # Vérification seulement

═══════════════════════════════════════════════════════════════════

✅ CE QUI EST INJECTÉ

Scripts autonomes:
  ✅ utils.ts, acp.ts, release.ts, update-version.ts
  ✅ esbuild.config.ts, help.ts
  ✅ Configuration TypeScript et ESLint
  ✅ Workflows GitHub Actions (Yarn)
  ✅ Vérification Git sync automatique

Résultat: Plugin 100% autonome, aucune dépendance externe

═══════════════════════════════════════════════════════════════════

📦 WORKFLOW NPM (quand stable)

  1. yarn build-npm               # Build package
  2. yarn v                       # Update version
  3. npm publish                  # Publier (nécessite npm login)

VERSION ACTUELLE: 1.0.6
`);
