# Obsidian Plugin Config

Centralized configuration and development tools for Obsidian plugin development.

## Overview

This repository provides a centralized architecture for managing multiple Obsidian plugins with shared configurations, scripts, and dependencies. It eliminates duplication and ensures consistency across all plugin projects.

## Key Features

- **Centralized Configuration**: Shared TypeScript, ESLint, and build configurations
- **Automated Migration**: CLI tools to migrate existing plugins to centralized architecture
- **Version Synchronization**: Automatic dependency version management across all plugins
- **Development Tools**: Unified scripts for building, testing, and releasing plugins
- **Template Integration**: Works with plugin template repositories for new projects

## Installation

### For New Plugins

Use the plugin template repository which includes centralized configuration.

### For Existing Plugins

Use the automated migration tool:

```bash
# Basic migration
yarn migrate-config "../path/to/existing-plugin"

# Preview changes without applying (debugging/verification)
yarn migrate-config --dry-run "../path/to/existing-plugin"

# Interactive plugin selection
yarn migrate-config --interactive
```

### Requirements

- Plugins must be installed locally for migration
- Recommended to keep all plugins in dedicated development folder
- Yarn package manager required (npm usage is blocked)

## 🛠️ Available Commands

### In Your Plugin (Template)

```bash
yarn start         # Bootstrap: install + dev mode
yarn dev           # Build in development mode (watch)
yarn build         # Production build
yarn real          # Build + install in real Obsidian vault
yarn acp           # Add-commit-push (centralized script)
yarn bacp          # Build + add-commit-push
yarn release       # Release automation (centralized script)
```

### In Centralized Config (Maintenance)

```bash
yarn acp           # Commit + push config changes
yarn update        # Update dependencies (= yarn upgrade)
```

## 🚀 Usage

### Generic Confirm Modal

```typescript
import { GenericConfirmModal } from "@/obsidian-plugin-config/modals";

// Simple usage
new GenericConfirmModal(this.app, {
  title: "Delete File",
  message: "Are you sure you want to delete this file?",
  confirmText: "Delete",
  cancelText: "Cancel",
  onConfirm: () => {
    // Delete the file
    console.log("File deleted");
  },
  onCancel: () => {
    console.log("Cancelled");
  },
}).open();
```

### Centralized Scripts

All build and development scripts are centralized. Your plugin just needs to call them:

```json
{
  "scripts": {
    "dev": "tsx ../obsidian-plugin-config/scripts/esbuild.config.ts",
    "acp": "tsx ../obsidian-plugin-config/scripts/acp.ts"
  }
}
```

## 📋 Components

- **GenericConfirmModal**: A reusable confirmation modal with lodash integration
- **Centralized Scripts**: Build, release, and development automation
- **Automatic Dependencies**: All required libraries installed transparently

## 🔧 Maintenance

### For Repository Maintainers

When you need to update this centralized config:

1. **Update dependencies** (if needed):

   ```bash
   yarn update    # or npm update, or yarn upgrade
   ```

2. **Make your changes** to components/configs

3. **Commit and push**:
   ```bash
   yarn acp       # Automatically commits with "Update centralized config"
   ```

### Troubleshooting

- **Version conflicts**: If you get Obsidian version errors, run `yarn update` to sync with the latest versions
- **Import errors**: Make sure you're using the correct import paths with `@/obsidian-plugin-config/`

## 🏗️ Architecture

### Professional Package Management

This repository works exactly like a professional NPM package:

- ✅ **Automatic dependency resolution** - All libraries installed transparently
- ✅ **Centralized scripts** - Build, release, and development tools
- ✅ **Rich components** - UI components can use any external library
- ✅ **Zero configuration** - Users don't need to know internal dependencies
- ✅ **Industry standard** - Uses Node.js native resolution mechanisms

### How It Works

```
Your Plugin:
├── package.json          ← Declares "obsidian-plugin-config": "file:../..."
├── yarn install          ← Automatically installs ALL dependencies
└── node_modules/         ← Contains esbuild, tsx, lodash, fs-extra, etc.

Centralized Config:
├── scripts/              ← Build and development scripts
├── src/modals/           ← UI components using external libraries
└── package.json          ← Defines ALL required dependencies
```

## 📁 Structure

```
obsidian-plugin-config/
├── src/
│   ├── index.ts                    # Main exports
│   └── modals/
│       ├── index.ts                # Modal exports
│       └── GenericConfirmModal.ts  # Uses lodash automatically
├── scripts/                        # Centralized build scripts
│   ├── esbuild.config.ts          # Build configuration
│   ├── acp.ts                     # Add-commit-push automation
│   └── release.ts                 # Release automation
├── package.json                   # ALL dependencies defined here
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

## 🔄 Migrating Existing Plugins

**Super Simple Migration** - The new architecture makes migration much easier!

### Step 1: Add Dependency

Add to your plugin's `package.json`:

```json
{
  "dependencies": {
    "obsidian-plugin-config": "file:../obsidian-plugin-config"
  }
}
```

### Step 2: Remove Local Scripts

```bash
rm -rf scripts/  # Delete your local scripts folder
```

### Step 3: Update Package Scripts

Update your `package.json` scripts to use centralized scripts:

```json
{
  "scripts": {
    "start": "yarn install && yarn dev",
    "dev": "tsx ../obsidian-plugin-config/scripts/esbuild.config.ts",
    "build": "tsx ../obsidian-plugin-config/scripts/esbuild.config.ts production",
    "real": "tsx ../obsidian-plugin-config/scripts/esbuild.config.ts production -r",
    "acp": "tsx ../obsidian-plugin-config/scripts/acp.ts",
    "bacp": "tsx ../obsidian-plugin-config/scripts/acp.ts -b",
    "release": "tsx ../obsidian-plugin-config/scripts/release.ts"
  }
}
```

### Step 4: Clean Dependencies

Remove duplicate dependencies from your `package.json` (they'll be installed automatically):

```bash
# Remove these if present: esbuild, tsx, fs-extra, semver, builtin-modules, etc.
```

### Step 5: Install

```bash
yarn install  # Automatically installs ALL dependencies!
```

### Step 6: Test

```bash
yarn start     # Should work immediately!
```

### Key Advantage

**You don't need to know what dependencies to install** - everything is automatic! 🎉

### Automated Migration Available!

Use `yarn migrate-config <path>` to automatically perform all these steps!

## 🎯 Integration with Plugin Template

This config is designed to work seamlessly with the `obsidian-sample-plugin-modif` template.

### Template Benefits:

- ✅ **Zero setup** - Everything pre-configured
- ✅ **Automatic dependencies** - All libraries installed transparently
- ✅ **Centralized scripts** - Build, release, and development tools
- ✅ **Professional architecture** - Industry-standard package management
- ✅ **Rich components** - UI components with external library support

### Perfect Synergy:

- **Template** = Your plugin structure + package.json configuration
- **Config** = Centralized scripts + reusable components + dependencies
- **Result** = Professional development experience with zero configuration! 🚀

## 📄 License

MIT
