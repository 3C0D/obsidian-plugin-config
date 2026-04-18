# Système d'Injection Interactive

## ✅ Fonctionnalité Ajoutée

Un système de sélection interactive permet maintenant de choisir quels fichiers injecter.

## Utilisation

### Mode par défaut (tout injecter)
```bash
obsidian-inject ../my-plugin
```

### Mode interactif (choisir quoi injecter)
```bash
obsidian-inject ../my-plugin --interactive
# ou
obsidian-inject ../my-plugin -i
```

### Presets rapides
```bash
# Minimal : scripts + package.json + .env
obsidian-inject ../my-plugin --preset=minimal

# Scripts uniquement
obsidian-inject ../my-plugin --preset=scripts-only

# Config uniquement (tsconfig, eslint, prettier, etc.)
obsidian-inject ../my-plugin --preset=config-only
```

## Options Disponibles

Le mode interactif permet de choisir :

1. **scripts** - Scripts (esbuild.config.ts, acp.ts, utils.ts, etc.)
2. **packageJson** - package.json (scripts & dependencies)
3. **tsconfig** - tsconfig.json
4. **eslint** - eslint.config.mts
5. **prettier** - .prettierrc & .prettierignore
6. **editorconfig** - .editorconfig
7. **vscode** - .vscode/ (settings.json, tasks.json, extensions.json)
8. **github** - .github/workflows/ (release workflow)
9. **gitignore** - .gitignore
10. **env** - .env (template)

## Presets

### minimal
- ✅ scripts
- ✅ packageJson
- ✅ env
- ❌ Tout le reste

### scripts-only
- ✅ scripts uniquement
- ❌ Tout le reste

### config-only
- ✅ tsconfig
- ✅ eslint
- ✅ prettier
- ✅ editorconfig
- ✅ vscode
- ✅ gitignore
- ❌ scripts, packageJson, github, env

## Exemple d'Utilisation

```bash
# Lancer en mode interactif
$ obsidian-inject ../my-plugin -i

🎯 Injection Options
Select what you want to inject (default: all)

Use default options (inject everything)? [Y/n]: n

📋 Select individual options:

Inject Scripts (esbuild.config.ts, acp.ts, utils.ts, etc.)? [Y/n]: y
Inject package.json (scripts & dependencies)? [Y/n]: y
Inject tsconfig.json? [Y/n]: n
Inject eslint.config.mts? [Y/n]: n
Inject .prettierrc & .prettierignore? [Y/n]: y
Inject .editorconfig? [Y/n]: y
Inject .vscode/ (settings.json, tasks.json, extensions.json)? [Y/n]: y
Inject .github/workflows/ (release workflow)? [Y/n]: n
Inject .gitignore? [Y/n]: y
Inject .env (template)? [Y/n]: y

📋 Selected options:
   ✅ Scripts (esbuild.config.ts, acp.ts, utils.ts, etc.)
   ✅ package.json (scripts & dependencies)
   ❌ tsconfig.json
   ❌ eslint.config.mts
   ✅ .prettierrc & .prettierignore
   ✅ .editorconfig
   ✅ .vscode/ (settings.json, tasks.json, extensions.json)
   ❌ .github/workflows/ (release workflow)
   ✅ .gitignore
   ✅ .env (template)

Proceed with these options? [Y/n]: y
```

## Fichiers Modifiés

1. **scripts/inject-options.ts** (nouveau) - Gestion des options
2. **scripts/inject-core.ts** - Ajout paramètre `options` aux fonctions
3. **scripts/inject-path.ts** - Ajout flags `--interactive` et `--preset`

## Cas d'Usage

### Ne pas écraser esbuild.config.ts existant
```bash
obsidian-inject ../my-plugin -i
# Répondre 'n' à "Inject Scripts"
```

### Injecter uniquement les configs
```bash
obsidian-inject ../my-plugin --preset=config-only
```

### Tout sauf GitHub workflows
```bash
obsidian-inject ../my-plugin -i
# Répondre 'n' uniquement à ".github/workflows/"
```

## Notes

- Le fichier `.npmrc` est toujours injecté (protection Yarn)
- En mode non-interactif, tout est injecté par défaut
- Les options peuvent être combinées : `--interactive --sass`
