#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin - Aide Rapide
Commandes disponibles dans ce plugin autonome

═══════════════════════════════════════════════════════════════════

📋 COMMANDES PRINCIPALES

DÉVELOPPEMENT:
  yarn start                       # Install dependencies + start dev
  yarn dev                         # Build dev mode avec hot reload
  yarn build                       # Build production
  yarn real                        # Build + install dans vault réel
  yarn lint, lint:fix             # ESLint vérification/correction

VERSION & RELEASE:
  yarn v, update-version           # Update version (package.json + manifest.json)
  yarn release, r                  # Create GitHub release avec tag

GIT OPERATIONS:
  yarn acp                         # Add, commit, push (avec Git sync)
  yarn bacp                        # Build + add, commit, push
  yarn run help, h                 # Cette aide

═══════════════════════════════════════════════════════════════════

🚀 WORKFLOW TYPIQUE

  1. yarn start                    # Setup initial
  2. yarn dev                      # Développement quotidien
  3. yarn build                    # Test build production
  4. yarn v                        # Update version
  5. yarn release                  # Publier release GitHub

═══════════════════════════════════════════════════════════════════

⚙️ CONFIGURATION

ENVIRONNEMENT:
  - Éditer .env pour définir TEST_VAULT et REAL_VAULT
  - Scripts autonomes (pas de dépendance externe)
  - Vérification Git sync automatique avant push

PLUGIN AUTONOME:
  ✅ Scripts locaux indépendants
  ✅ Configuration TypeScript et ESLint intégrée
  ✅ Workflows GitHub Actions avec Yarn
  ✅ Aucune dépendance vers obsidian-plugin-config
`);
