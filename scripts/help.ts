#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Guide Complet
Système d'injection pour plugins Obsidian autonomes

═══════════════════════════════════════════════════════════════════

🚀 UTILISATION RAPIDE (NPM Global)

Installation globale (une seule fois):
  npm install -g obsidian-plugin-config

Injection dans un plugin:
  cd mon-plugin && obsidian-inject
  obsidian-inject ../autre-plugin
  obsidian-inject "C:\\chemin\\vers\\plugin"

═══════════════════════════════════════════════════════════════════

🔧 DÉVELOPPEMENT LOCAL

Structure recommandée:
  mes-plugins/
  ├── obsidian-plugin-config/     # Ce repo
  ├── mon-plugin-1/
  ├── mon-plugin-2/
  └── test-sample-plugin/         # Pour tests

Installation:
  git clone https://github.com/3C0D/obsidian-plugin-config
  cd obsidian-plugin-config
  yarn install

Test injection locale:
  yarn inject ../mon-plugin --yes
  yarn inject-prompt "../mon-plugin"

═══════════════════════════════════════════════════════════════════

📦 WORKFLOW COMPLET : Local → NPM Package

ÉTAPE 1 - Développement Local:
  cd obsidian-plugin-config
  # Modifier scripts/ selon vos besoins
  yarn inject ../test-plugin --yes

ÉTAPE 2 - Corrections Obligatoires:
  # Corriger TOUS les imports dans scripts/
  # Changer .ts → .js dans les imports
  # Exemple: "./utils.ts" → "./utils.js"
  # Corriger imports ESM dans plugins cibles si nécessaire
  # Exemple: "./CommentHelper" → "./CommentHelper.js"

ÉTAPE 3 - Build NPM:
  yarn build-npm                  # Corrige automatiquement
  yarn update-version              # Choisir p/min/maj

ÉTAPE 4 - Test Local Package:
  npm pack
  npm install -g ./obsidian-plugin-config-X.X.X.tgz
  obsidian-inject ../test-plugin  # Tester commande globale

ÉTAPE 5 - Publication NPM:
  npm login                       # OBLIGATOIRE !
  npm publish                     # Après connexion réussie

═══════════════════════════════════════════════════════════════════

🔑 CONNEXION NPM - Points Critiques

PRÉREQUIS OBLIGATOIRES:
  ✅ Compte NPM sur https://www.npmjs.com
  ✅ Email vérifié
  ✅ 2FA activé (obligatoire pour publier)
  ✅ Nom de package disponible

RÉSOLUTION PROBLÈMES:
  npm logout
  npm login --registry https://registry.npmjs.org/
  npm whoami                      # Vérifier connexion
  npm profile enable-2fa auth-and-writes

CONTOURNEMENTS TESTÉS:
  ✅ Développement local : Fonctionne sans connexion
  ✅ Test npm pack : Fonctionne sans connexion
  ❌ Publication : Connexion NPM OBLIGATOIRE (pas de contournement)

═══════════════════════════════════════════════════════════════════

🔄 WORKFLOW MISE À JOUR

Pour futures modifications:
  1. cd obsidian-plugin-config
  2. Modifier scripts/...
  3. yarn inject ../test-plugin --yes
  4. Corriger imports (.ts → .js)
  5. yarn build-npm
  6. yarn update-version
  7. npm pack && npm install -g ./package.tgz
  8. npm publish

═══════════════════════════════════════════════════════════════════

🏗️ ADAPTATION PERSONNALISÉE

Pour créer votre propre version:
  1. git clone https://github.com/3C0D/obsidian-plugin-config
  2. Modifier package.json (nom, version, etc.)
  3. Adapter scripts/ selon vos besoins
  4. Adapter templates/ (configurations par défaut)
  5. Tester: yarn inject ../votre-plugin --yes
  6. Publier votre package: npm publish

═══════════════════════════════════════════════════════════════════

📋 COMMANDES DISPONIBLES

INJECTION:
  yarn inject <chemin> --yes      # Injection automatique
  yarn inject-prompt <chemin>     # Injection avec prompts

MAINTENANCE:
  yarn acp                        # Add, commit, push
  yarn update-version, v          # Mise à jour version
  yarn build-npm                  # Build package NPM
  yarn help, h                    # Cette aide

═══════════════════════════════════════════════════════════════════

✅ CE QUI EST INJECTÉ

Scripts locaux autonomes:
  ✅ esbuild.config.ts (build production/dev)
  ✅ acp.ts (add-commit-push)
  ✅ update-version.ts (gestion versions)
  ✅ release.ts (releases GitHub)
  ✅ help.ts (aide locale)
  ✅ utils.ts (utilitaires partagés)

Configuration:
  ✅ package.json (scripts, dépendances, protection yarn)
  ✅ tsconfig.json (configuration TypeScript optimisée)
  ✅ Installation automatique dépendances

Résultat:
  ✅ Plugin 100% AUTONOME
  ✅ Aucune dépendance externe
  ✅ Mise à jour via re-injection
  ✅ Compatible tous plugins Obsidian

═══════════════════════════════════════════════════════════════════

⚠️  POINTS IMPORTANTS

- Toujours tester localement avant publication NPM
- Corriger les extensions .ts → .js dans les imports
- Connexion NPM obligatoire pour publier
- Sauvegarder vos modifications avant re-injection
- Utiliser yarn (protection intégrée)

COMPTE NPM: 3c0d (connecté)
VERSION: 1.0.6
`);
