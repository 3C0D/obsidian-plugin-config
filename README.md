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
# Installation & Setup
yarn i                   # Install dependencies
yarn update-exports      # Update package.json exports

# Git & Version Management
yarn acp                 # Add, commit, push
yarn bacp                # Build + add, commit, push
yarn v                   # Update version

# Build & Testing
yarn build               # TypeScript check (no build needed)
yarn dev                 # Development build (watch mode)
yarn real                # Build to real vault
yarn lint, lint:fix      # ESLint verification/correction

# Injection (Development phase)
yarn inject-prompt       # Interactive injection
yarn inject-path         # Direct injection
yarn inject, check-plugin # Injection shortcuts

# NPM Publishing
yarn npm-publish         # Complete NPM workflow
yarn build-npm           # Alias for npm-publish

# Help
yarn help                # Show help
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

### As a Plugin (for testing NPM exports)

```bash
# Setup vault paths in .env
echo "TEST_VAULT=C:/path/to/test/vault" >> .env
echo "REAL_VAULT=C:/path/to/real/vault" >> .env

# Development mode
yarn start                # Start development mode
yarn dev                  # Watch mode for development
yarn real                 # Install to real vault
```

### Local injection test

```bash
# Automatic injection
yarn inject ../my-plugin --yes

# Injection with prompts
yarn inject-prompt "../my-plugin"
```

### Development Workflow

```bash
# Standard workflow
1. yarn i                # Install dependencies
2. Make changes to obsidian-plugin-config
3. yarn update-exports   # Update exports if needed
4. yarn lint:fix         # Fix any linting issues
5. yarn v                # Update version + commit + push GitHub
6. yarn npm-publish      # Complete NPM workflow

# Testing as plugin (optional)
yarn dev                 # Watch mode for development
yarn real                # Install to real vault

# Injection testing (development phase)
yarn inject ../test-plugin --yes
```

### Key Commands Summary

```bash
# Essential workflow
yarn i                 # Install dependencies
yarn update-exports    # Update exports
yarn v                 # Update version + commit + push
yarn npm-publish       # Complete NPM workflow

# Development & testing
yarn dev               # Test as plugin (watch mode)
yarn lint:fix          # Fix code issues
yarn help              # Full help
```
