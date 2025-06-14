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
npm update -g obsidian-plugin-config
```

## Commands

### For Plugin Config Development

```bash
# Development
yarn start                # Install dependencies + update exports
yarn build                # Build the project
yarn dev                  # Development build
yarn real                 # Build to real vault

# Git Operations
yarn acp                  # Add, commit, push
yarn bacp                 # Build + add, commit, push
yarn v                    # Update version

# NPM Publishing
yarn build-npm            # Build NPM package
yarn publish-npm          # Publish to NPM

# Help
yarn help                 # Show help
```

### For Plugin Injection

```bash
# Interactive injection (recommended)
obsidian-inject
obsidian-inject ../my-plugin
yarn inject-prompt "../my-plugin"

# Automatic injection
obsidian-inject ../my-plugin --yes
yarn inject-path ../my-plugin --yes

# Verification only
yarn check-plugin ../my-plugin
```

## What is injected

- ✅ **Standalone local scripts**: `esbuild.config.ts`, `acp.ts`, `update-version.ts`, etc.
- ✅ **package.json configuration**: scripts, dependencies, yarn protection
- ✅ **tsconfig.json template**: modern optimized TypeScript configuration
- ✅ **Automatic installation** of dependencies with yarn
- ✅ **Traceability file**: `.injection-info.json` (version, injection date)

## Commands available after injection

```bash
yarn build          # Production build
yarn dev            # Development build + watch
yarn start          # Install dependencies + start dev
yarn real           # Build to real vault
yarn acp            # Add-commit-push
yarn bacp           # Build + add-commit-push
yarn v              # Update version
yarn release        # GitHub release
yarn help           # Full help
```

## Architecture

The plugin becomes **100% STANDALONE** after injection:

- ❌ **No external dependencies** required
- ✅ **Scripts integrated locally**
- ✅ **Updatable** via re-injection
- ✅ **Yarn protection** maintained
- ✅ **Compatible with all Obsidian plugins**

## Local Development (for contributors)

### Installation

```bash
git clone https://github.com/3C0D/obsidian-plugin-config
cd obsidian-plugin-config
yarn install
```

### Local injection test

```bash
# Automatic injection
yarn inject ../my-plugin --yes

# Injection with prompts
yarn inject-prompt "../my-plugin"
```

### Full workflow: Local → NPM

```bash
# 1. Local development
yarn inject ../test-plugin --yes

# 2. Fix ESM imports if necessary
# Example: "./utils.ts" → "./utils.js"

# 3. Build and publish to NPM
yarn build-npm
yarn update-version
npm login
npm publish
```

### Maintenance commands

```bash
yarn acp                # Add, commit, push
yarn update-version     # Update version
yarn build-npm         # Build NPM package
yarn help              # Full help
```
