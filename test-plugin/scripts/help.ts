#!/usr/bin/env tsx

console.log(`
🎯 Plugin Obsidian - Scripts Autonomes
Configuration injectée par obsidian-plugin-config

═══════════════════════════════════════════════════════════════════

📋 COMMANDES DISPONIBLES

DÉVELOPPEMENT:
  yarn start                      # Install + dev mode
  yarn dev                        # Mode développement (watch)
  yarn build                      # Build production
  yarn real                       # Build + install dans vault réel

GESTION VERSIONS:
  yarn update-version, v          # Mise à jour version
  yarn release, r                 # Release GitHub

MAINTENANCE:
  yarn acp                        # Add, commit, push
  yarn bacp                       # Build + add, commit, push
  yarn help, h                    # Cette aide

═══════════════════════════════════════════════════════════════════

🚀 WORKFLOW DÉVELOPPEMENT

PREMIÈRE UTILISATION:
  yarn start                      # Configure tout automatiquement

DÉVELOPPEMENT QUOTIDIEN:
  yarn dev                        # Mode watch (rebuild automatique)
  # Modifier src/main.ts
  # Le plugin se recharge automatiquement dans Obsidian

AVANT COMMIT:
  yarn build                      # Vérifier que tout compile
  yarn acp                        # Commit + push

RELEASE:
  yarn update-version             # Choisir nouvelle version
  yarn release                    # Créer release GitHub

═══════════════════════════════════════════════════════════════════

🔧 CONFIGURATION AUTOMATIQUE

Variables d'environnement (.env):
  TEST_VAULT=chemin/vers/vault/test     # Vault de développement
  REAL_VAULT=chemin/vers/vault/réel     # Vault de production

Ces chemins sont configurés automatiquement au premier lancement.

═══════════════════════════════════════════════════════════════════

📁 STRUCTURE DU PROJET

src/
  ├── main.ts                     # Point d'entrée principal
  ├── styles.css                  # Styles (optionnel)
  └── ...                         # Autres fichiers source

scripts/                          # Scripts autonomes injectés
  ├── esbuild.config.ts           # Configuration build
  ├── acp.ts                      # Add-commit-push
  ├── update-version.ts           # Gestion versions
  ├── release.ts                  # Releases GitHub
  ├── help.ts                     # Cette aide
  └── utils.ts                    # Utilitaires

Configuration:
  ├── package.json                # Scripts et dépendances
  ├── tsconfig.json               # Configuration TypeScript
  ├── manifest.json               # Métadonnées plugin
  └── .env                        # Variables d'environnement

═══════════════════════════════════════════════════════════════════

🔄 MISE À JOUR DES SCRIPTS

Pour mettre à jour les scripts injectés:

Via NPM global:
  obsidian-inject                 # Dans le dossier du plugin
  obsidian-inject .               # Même chose

Via injection locale:
  cd ../obsidian-plugin-config
  yarn inject ../ce-plugin --yes

⚠️  Sauvegardez vos modifications avant re-injection !

═══════════════════════════════════════════════════════════════════

✅ SCRIPTS AUTONOMES INJECTÉS

Ce plugin contient des scripts 100% autonomes:
  ✅ Aucune dépendance externe vers obsidian-plugin-config
  ✅ Tous les utilitaires inclus localement
  ✅ Configuration TypeScript optimisée
  ✅ Build esbuild configuré pour Obsidian
  ✅ Gestion automatique des vaults de développement

Injecté par: obsidian-plugin-config
`);
