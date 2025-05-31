# Obsidian Plugin Config

Système d'injection pour plugins Obsidian autonomes.

## Installation Globale

```bash
npm install -g obsidian-plugin-config
```

## Utilisation

### Injection dans un plugin existant

```bash
cd votre-plugin-obsidian
obsidian-inject
```

### Injection par chemin

```bash
obsidian-inject /chemin/vers/plugin
```

## Ce qui est injecté

- **Scripts locaux** : esbuild.config.ts, acp.ts, update-version.ts, utils.ts
- **Configuration package.json** : scripts, dépendances, protection yarn
- **Dossiers requis** : .github/workflows
- **Installation automatique** des dépendances

## Commandes disponibles

```bash
yarn inject-path <chemin>    # Injection par chemin
yarn inject <chemin>         # Alias
yarn migrate <chemin>        # Migration de plugins (développement)
yarn acp                     # Add-commit-push
yarn h                       # Aide
```

## Architecture

Système d'injection qui transforme n'importe quel plugin en version autonome avec scripts locaux intégrés.
