# Obsidian Plugin Config

🎯 Global CLI injection tool for Obsidian plugins.

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
yarn h           # Full help
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

Target plugins become **100% standalone** after injection:

- ✅ Scripts integrated locally (no external runtime dependency)
- ✅ Updatable via re-injection
- ✅ Yarn protection enforced
- ✅ Compatible with all Obsidian plugins

---

## Development (for contributors)

### Setup

```bash
git clone https://github.com/3C0D/obsidian-plugin-config
cd obsidian-plugin-config
yarn install
```

### Local injection commands

```bash
yarn inject-prompt              # Interactive injection
yarn inject-path ../my-plugin   # Direct injection
yarn inject ../my-plugin --sass # With SASS support
yarn check-plugin ../my-plugin  # Dry-run only
```

### Publish workflow

```bash
yarn npm-publish    # All-in-one:
                    # 1. Version bump
                    # 2. Generate bin/obsidian-inject.js
                    # 3. Verify package
                    # 4. Commit + push
                    # 5. Publish to NPM
                    # 6. Update global CLI (optional)
```
