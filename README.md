# Obsidian Plugin Configuration

Centralized configuration for Obsidian plugin development.

## Overview

This repository contains shared configuration files and scripts for developing Obsidian plugins. It helps maintain consistency across multiple plugin projects and simplifies updates to build processes, linting rules, and TypeScript configurations.

## Features

- TypeScript configuration
- ESLint rules
- Build scripts using esbuild
- Release automation
- Utility scripts for development workflow

## Usage

### Installation

Add this repository as a dependency in your Obsidian plugin project:

```bash
# Using npm
npm install --save-dev github:3C0D/obsidian-plugin-config#main

# Using yarn
yarn add --dev github:3C0D/obsidian-plugin-config#main
```

Or add it directly to your `package.json`:

```json
{
  "devDependencies": {
    "obsidian-plugin-config": "github:3C0D/obsidian-plugin-config#main"
  }
}
```

### TypeScript Configuration

Extend the base TypeScript configuration in your `tsconfig.json`:

```json
{
  "extends": "./node_modules/obsidian-plugin-config/tsconfig/plugin.json"
}
```

### ESLint Configuration

Use the shared ESLint configuration:

```js
// eslint.config.js
import baseConfig from './node_modules/obsidian-plugin-config/eslint/plugin.js';
export default baseConfig;
```

### Scripts

Update your `package.json` scripts to use the shared build and release scripts:

```json
{
  "scripts": {
    "start": "yarn install && yarn dev",
    "dev": "tsx obsidian-plugin-config/scripts/esbuild.config.ts",
    "build": "tsx obsidian-plugin-config/scripts/esbuild.config.ts production",
    "real": "tsx obsidian-plugin-config/scripts/esbuild.config.ts production -r",
    "acp": "tsx obsidian-plugin-config/scripts/acp.ts",
    "bacp": "tsx obsidian-plugin-config/scripts/acp.ts -b",
    "release": "tsx obsidian-plugin-config/scripts/release.ts"
  }
}
```

## Available Scripts

- `dev`: Start development mode with hot reloading
- `build`: Build the plugin for production
- `real`: Build and install the plugin in your Obsidian vault
- `acp`: Add, commit, and push changes to GitHub
- `bacp`: Build, add, commit, and push changes to GitHub
- `release`: Create a new release with version bump

## Structure

```
obsidian-plugin-config/
├── tsconfig/
│   ├── base.json         # Base TypeScript configuration
│   └── plugin.json       # Plugin-specific TypeScript configuration
├── eslint/
│   ├── base.js           # Base ESLint rules
│   └── plugin.js         # Plugin-specific ESLint configuration
├── scripts/
│   ├── esbuild.config.ts # Build script
│   ├── release.ts        # Release automation
│   ├── acp.ts            # Add-commit-push script
│   └── utils.ts          # Shared utilities
└── templates/
    └── plugin/           # Template for new plugins
```

## Environment Variables

For development outside the Obsidian vault, create a `.env` file with:

```
TEST_VAULT=path/to/test/vault/.obsidian/plugins
REAL_VAULT=path/to/real/vault/.obsidian/plugins
```

## License

MIT