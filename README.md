# Obsidian Plugin Config

🎯 Système d'injection pour plugins Obsidian autonomes.

[![NPM Version](https://img.shields.io/npm/v/obsidian-plugin-config)](https://www.npmjs.com/package/obsidian-plugin-config)
[![License](https://img.shields.io/npm/l/obsidian-plugin-config)](LICENSE)

**Version actuelle : 1.0.6**

## Installation Globale

```bash
npm install -g obsidian-plugin-config
```

## Utilisation

### Injection dans le répertoire courant

```bash
cd votre-plugin-obsidian
obsidian-inject
```

### Injection par chemin

```bash
obsidian-inject ../mon-plugin
obsidian-inject "C:\chemin\vers\plugin"
```

### Vérification (sans injection)

```bash
# Vérifier si un plugin est déjà injecté
yarn check-plugin ../mon-plugin
yarn verify-plugin ../mon-plugin  # alias
```

### Aide

```bash
obsidian-inject --help
```

## Ce qui est injecté

- ✅ **Scripts locaux autonomes** : `esbuild.config.ts`, `acp.ts`, `update-version.ts`, `utils.ts`, `help.ts`, `release.ts`
- ✅ **Configuration package.json** : scripts, dépendances, protection yarn obligatoire, `"type": "module"` pour ESM
- ✅ **Template tsconfig.json** : configuration TypeScript moderne optimisée
- ✅ **Installation automatique** des dépendances avec yarn
- ✅ **Analyse des imports centralisés** avec avertissements

## ⚠️ Configuration ESM Moderne

Le système utilise une configuration TypeScript moderne avec ESM. Si votre plugin a des imports relatifs, vous devrez peut-être les corriger :

```typescript
// ❌ Ancien format
import { helper } from "./MyHelper";

// ✅ Format ESM requis
import { helper } from "./MyHelper.js";
```

Cette correction est nécessaire une seule fois après l'injection.

## Commandes disponibles après injection

```bash
yarn build          # Build production
yarn dev            # Build développement + watch
yarn start          # Alias pour dev
yarn real           # Build vers vault réel (nécessite REAL_VAULT)
yarn acp            # Add-commit-push
yarn bacp           # Build + add-commit-push
yarn update-version # Mise à jour version + commit + push
yarn v              # Alias pour update-version
yarn release        # Release GitHub
yarn r              # Alias pour release
yarn help           # Aide complète
yarn h              # Alias pour help
```

## Architecture

Le plugin devient **100% AUTONOME** après injection :

- ❌ **Aucune dépendance externe** requise
- ✅ **Scripts intégrés localement**
- ✅ **Mise à jour possible** via re-injection
- ✅ **Protection yarn** maintenue
- ✅ **Compatible avec tous les plugins Obsidian**

## Développement Local (pour contributeurs)

### Installation

```bash
git clone https://github.com/3C0D/obsidian-plugin-config
cd obsidian-plugin-config
yarn install
```

### Test injection locale

```bash
# Injection automatique
yarn inject ../mon-plugin --yes

# Injection avec prompts
yarn inject-prompt "../mon-plugin"
```

### Workflow complet : Local → NPM

```bash
# 1. Développement local
yarn inject ../test-plugin --yes

# 2. Corriger imports ESM si nécessaire
# Exemple: "./utils.ts" → "./utils.js"

# 3. Build et publication NPM
yarn build-npm
yarn update-version
npm login
npm publish
```

### Commandes de maintenance

```bash
yarn acp                # Add, commit, push
yarn update-version     # Mise à jour version
yarn build-npm         # Build package NPM
yarn help              # Aide complète
```
