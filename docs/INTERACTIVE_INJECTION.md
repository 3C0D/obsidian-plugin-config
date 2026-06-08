# Injection interactive

L'injection est **interactive par défaut** : elle compare chaque fichier du template
avec le fichier existant de la cible et ne demande confirmation que lorsque le contenu
diffère.

## Points d'entrée

```bash
# CLI globale
obsidian-inject                 # Injection dans le dossier courant
obsidian-inject ../my-plugin    # Injection par chemin

# Scripts locaux (développement de ce repo)
yarn inject-prompt              # Demande le chemin du plugin cible, puis injecte
yarn inject-path ../my-plugin   # Injection directe par chemin
yarn check-plugin ../my-plugin  # Dry-run (vérification seule, aucune modification)
```

## Comportement fichier par fichier

Pendant l'injection, chaque fichier est traité ainsi :

- **La cible n'existe pas encore** → le fichier est injecté sans demander.
- **Contenu identique** → ignoré silencieusement (`✅ ... (unchanged)`).
- **Contenu différent** → l'outil demande `Update <fichier>? (content differs)`.
  - `y` → le fichier est remplacé.
  - `n` → le fichier existant est conservé (`⏭️ Kept existing ...`).

Cas particuliers :

- `.env` est toujours **fusionné** : le template est réécrit en préservant les
  valeurs déjà renseignées (chemins de vault, etc.).
- `.npmrc` est toujours injecté (protection Yarn).
- `eslint.config.mts` est approuvé automatiquement si un ancien `.eslintrc*`
  est détecté (migration depuis l'ancien format).

## Options

```bash
# Auto-confirmer tous les remplacements (aucune question)
obsidian-inject ../my-plugin --yes    # CLI globale : --yes / -y
yarn inject-path ../my-plugin --yes   # Scripts locaux : --yes / -y

# Vérification seule (n'écrit rien)
obsidian-inject ../my-plugin --dry-run
```

| Option           | Effet                                              |
| ---------------- | -------------------------------------------------- |
| `--yes`, `-y`    | (CLI globale) auto-confirme tous les remplacements |
| `--yes`, `-y`    | (scripts locaux) auto-confirme tous les remplacements |
| `--dry-run`      | vérification seule, aucune modification            |

## Ce qui est injecté

Tous les fichiers du template sont pris en compte à chaque injection (pas de
sélection par composant) :

- `templates/scripts/*` → `<cible>/scripts/`
- `templates/tsconfig.json.template`, `eslint.config.mts`, `.editorconfig`,
  `.prettierrc`, `.prettierignore`, `.npmrc`, `.env`
- `templates/.vscode/*`
- `templates/.github/workflows/*`
- `templates/gitignore.template` → `<cible>/.gitignore`

La confirmation fichier par fichier permet de conserver un fichier existant
(par exemple un `esbuild.config.ts` personnalisé) en répondant `n` lorsque la
question apparaît.

## Fichiers concernés

1. **scripts/inject-core.ts** — logique d'injection (`diffAndPromptFiles`,
   `injectScripts`, `updatePackageJson`, `performInjection`).
2. **scripts/inject-prompt.ts** — entrée interactive (demande le chemin).
3. **scripts/inject-path.ts** — entrée CLI (parse `--yes`, `--dry-run`).
