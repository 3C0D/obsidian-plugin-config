# Obsidian Plugin Config

🎯 Injection system for standalone Obsidian plugins.

[![NPM Version](https://img.shields.io/npm/v/obsidian-plugin-config)](https://www.npmjs.com/package/obsidian-plugin-config)
[![License](https://img.shields.io/npm/l/obsidian-plugin-config)](LICENSE)

## Installation

```bash
npm install -g obsidian-plugin-config
```

## Update

```bash
npm install -g obsidian-plugin-config@latest --force
```

## Usage (global CLI)

```bash
# Inject in current plugin directory
obsidian-inject

# Inject by path
obsidian-inject ../my-plugin

# Inject with SASS support (adds esbuild-sass-plugin)
obsidian-inject ../my-plugin --sass

# Verification only (no changes)
obsidian-inject ../my-plugin --dry-run

# Help
obsidian-inject --help
```

## What is injected

- ✅ **Standalone local scripts**: `esbuild.config.ts`, `acp.ts`,
  `update-version.ts`, `release.ts`, `help.ts`, `utils.ts`
- ✅ **package.json**: scripts, dependencies, yarn protection
- ✅ **tsconfig.json**: modern optimized TypeScript configuration
- ✅ **eslint.config.mts**: ESLint flat config
- ✅ **Config files**: `.editorconfig`, `.prettierrc`, `.npmrc`,
  `.env`, `.vscode/settings.json`, `.vscode/tasks.json`
- ✅ **GitHub Actions**: release workflow
- ✅ **Traceability**: `.injection-info.json` (version, date)
- 🎨 **SASS support**: optional, via `--sass` flag

## Commands available after injection

```bash
yarn start          # Install dependencies + start dev
yarn dev            # Development build (watch mode)
yarn build          # Production build
yarn real           # Build + install to real vault
yarn acp            # Add, commit, push
yarn bacp           # Build + add, commit, push
yarn v              # Update version
yarn release        # GitHub release
yarn lint           # ESLint check
yarn lint:fix       # ESLint fix
yarn help           # Full help
```

## SASS Support

```bash
obsidian-inject ../my-plugin --sass
```

What gets added:
- ✅ `esbuild-sass-plugin` dependency
- ✅ Automatic `.scss` detection (`src/styles.scss` priority)
- ✅ CSS cleanup after compilation

## Architecture

The plugin becomes **100% standalone** after injection:

- ✅ Scripts integrated locally (no external runtime dependency)
- ✅ Updatable via re-injection
- ✅ Yarn protection enforced
- ✅ Compatible with all Obsidian plugins

---

## Local Development (for contributors)

This repo has **two roles**:

1. **Injection system** — `templates/` + `scripts/inject-*.ts`
2. **Snippet development** — `src/` is a local Obsidian plugin
   used to develop and export reusable code (modals, helpers)

### Setup

```bash
git clone https://github.com/3C0D/obsidian-plugin-config
cd obsidian-plugin-config
yarn install
```

### Configure vault paths

```bash
# Edit .env
TEST_VAULT=C:/path/to/test/vault
REAL_VAULT=C:/path/to/real/vault
```

### Development commands

```bash
yarn dev            # Watch mode (test as local plugin)
yarn real           # Install to real vault
yarn lint:fix       # Fix linting issues
yarn update-exports # Regenerate src/index.ts exports
```

### Injection commands (local)

```bash
yarn inject-prompt              # Interactive injection
yarn inject-path ../my-plugin   # Direct injection
yarn inject ../my-plugin --sass # With SASS support
yarn check-plugin ../my-plugin  # Dry-run only
```

### Publish workflow

```bash
yarn npm-publish    # All-in-one (7 steps):
                    # 0. NPM auth check
                    # 1. Version bump
                    # 2. Update exports
                    # 3. Generate bin/obsidian-inject.js
                    # 4. Verify package
                    # 5. Commit + push
                    # 6. Publish to NPM
                    # 7. Update global CLI (ask, or auto with --auto-update)
```

> `yarn acp` is only needed for intermediate commits —
> not required before `yarn npm-publish`.
