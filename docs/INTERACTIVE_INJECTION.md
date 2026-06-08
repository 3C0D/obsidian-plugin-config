# Interactive Injection

Injection is **interactive by default**: it compares each template file with the target's existing file and only prompts for confirmation when the content differs.

## Entry Points

```bash
# Global CLI
obsidian-inject                 # Inject in current directory
obsidian-inject ../my-plugin    # Inject by path

# Local scripts (development of this repo)
yarn inject-prompt              # Prompts for target plugin path, then injects
yarn inject-path ../my-plugin   # Direct injection by path
yarn check-plugin ../my-plugin  # Dry-run (verification only, no modifications)
```

## File-by-File Behavior

During injection, each file is handled as follows:

- **Target does not exist yet** → the file is injected without asking.
- **Identical content** → silently ignored (`✅ ... (unchanged)`).
- **Different content** → the tool asks `Update <file>? (content differs)`.
  - `y` → the file is replaced.
  - `n` → the existing file is kept (`⏭️ Kept existing ...`).

Special cases:

- `.env` is always **merged**: the template is rewritten while preserving existing values (vault paths, etc.).
- `.npmrc` is always injected (Yarn protection).
- `eslint.config.mts` is automatically approved if an old `.eslintrc*` is detected (migration from the old format).

## Options

```bash
# Auto-confirm all replacements (no questions)
obsidian-inject ../my-plugin --yes    # Global CLI: --yes / -y
yarn inject-path ../my-plugin --yes   # Local scripts: --yes / -y

# Verification only (writes nothing)
obsidian-inject ../my-plugin --dry-run
```

| Option        | Effect                                         |
| ------------- | ---------------------------------------------- |
| `--yes`, `-y` | (Global CLI) auto-confirms all replacements    |
| `--yes`, `-y` | (Local scripts) auto-confirms all replacements |
| `--dry-run`   | Verification only, no modifications            |

## What is Injected

All template files are considered during each injection (no component selection):

- `templates/scripts/*` → `<target>/scripts/`
- `templates/tsconfig.json.template`, `eslint.config.mts`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `.npmrc`, `.env`
- `templates/.vscode/*`
- `templates/.github/workflows/*`
- `templates/gitignore.template` → `<target>/.gitignore`

File-by-file confirmation allows keeping an existing file (for example, a custom `esbuild.config.ts`) by answering `n` when the prompt appears.

## Related Files

1. **scripts/inject-core.ts** — injection logic (`diffAndPromptFiles`, `injectScripts`, `updatePackageJson`, `performInjection`).
2. **scripts/inject-prompt.ts** — interactive entry (prompts for path).
3. **scripts/inject-path.ts** — CLI entry (parses `--yes`, `--dry-run`).
