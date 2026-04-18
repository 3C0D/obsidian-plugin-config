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
# Inject in current plugin directory (with confirmation)
obsidian-inject

# Inject by path (with confirmation)
obsidian-inject ../my-plugin

# Inject without confirmation
obsidian-inject ../my-plugin --no

# Inject with SASS support (adds esbuild-sass-plugin)
obsidian-inject ../my-plugin --sass

# Interactive mode (choose what to inject)
obsidian-inject ../my-plugin --interactive

# Use preset
obsidian-inject ../my-plugin --preset=minimal

# Verification only (no changes)
obsidian-inject ../my-plugin --dry-run

# Help
obsidian-inject --help
```

## CLI Options

- `--no`, `-n` - Skip confirmation prompts (auto-confirm)
- `--sass` - Add SASS support (esbuild-sass-plugin)
- `--interactive`, `-i` - Choose what to inject interactively
- `--preset=<name>` - Use preset (minimal, scripts-only, config-only)
- `--dry-run` - Verification only (no changes)

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
yarn r              # GitHub release
yarn lint           # ESLint check
yarn lint:fix       # ESLint fix
yarn prettier       # Prettier check
yarn prettier:fix   # Prettier format all
yarn h              # Full help
```

## Updating Dependencies

```bash
yarn upgrade        # Update all dependencies to latest
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

## Development Workflow (for injected plugins)

After injection, your plugin has a complete development setup:

### Environment Setup

**In-place development** (inside vault):
- Develop directly in `.obsidian/plugins/your-plugin`
- Run `yarn dev` - builds automatically to current location

**External development** (outside vault):
- Develop anywhere on your system
- Configure `.env` file with vault paths:
  ```bash
  TEST_VAULT=/path/to/test/vault
  REAL_VAULT=/path/to/production/vault
  ```
- Run `yarn dev` - builds to TEST_VAULT
- Run `yarn real` - builds to REAL_VAULT

### Development Commands

```bash
yarn start          # Install dependencies + start dev
yarn dev            # Watch mode (auto-rebuild on changes)
yarn build          # Production build
yarn real           # Build to production vault
```

### Version & Release

```bash
yarn v              # Update version (prompts for type)
yarn acp            # Add, commit, push changes
yarn bacp           # Build + add, commit, push
yarn r              # Create GitHub release
```

### Code Quality

```bash
yarn lint           # Check for linting errors
yarn lint:fix       # Auto-fix linting errors
yarn prettier       # Check formatting
yarn prettier:fix   # Auto-format all files
```

### Recommended Workflow

1. `yarn start` - Install and start development
2. Make changes, test in Obsidian
3. `yarn bacp` - Build and commit changes
4. `yarn v` - Update version
5. `yarn r` - Create release

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
