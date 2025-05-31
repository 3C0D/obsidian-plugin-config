# Obsidian Plugin Config

🎯 Système d'injection pour plugins Obsidian autonomes.

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

### Aide

```bash
obsidian-inject --help
```

## Ce qui est injecté

- ✅ **Scripts locaux autonomes** : `esbuild.config.ts`, `acp.ts`, `update-version.ts`, `utils.ts`, `help.ts`, `release.ts`
- ✅ **Configuration package.json** : scripts, dépendances, protection yarn obligatoire
- ✅ **Template tsconfig.json** : configuration TypeScript optimisée
- ✅ **Installation automatique** des dépendances avec yarn
- ✅ **Analyse des imports centralisés** avec avertissements

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

```bash
git clone https://github.com/3C0D/obsidian-plugin-config
cd obsidian-plugin-config
yarn install

# Test injection locale
yarn inject ../mon-plugin --yes
yarn inject-prompt "../mon-plugin"

# Build package NPM
yarn build-npm
```
