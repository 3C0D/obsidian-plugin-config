# Obsidian Plugin Config

Centralized configuration and reusable components for Obsidian plugin development.

## 📦 Installation

### For New Plugins
Use the `obsidian-sample-plugin-modif` template which already includes this configuration.

### For Existing Plugins
Add the dependency directly in your `package.json`:

```json
{
  "dependencies": {
    "obsidian-plugin-config": "file:../obsidian-plugin-config"
  }
}
```

Then run:
```bash
yarn install
# or
npm install
```

## 🛠️ Available Commands

### Update Dependencies
```bash
# All these commands update dependencies:
yarn update         # Our alias (= yarn upgrade)
npm update          # Native npm command
yarn upgrade        # Native yarn command
```

### Commit & Push Changes
```bash
yarn acp           # Add, commit, and push changes
# or
npm run acp        # Same as above
```

## 🚀 Usage

### Generic Confirm Modal

```typescript
import { GenericConfirmModal } from '@/obsidian-plugin-config/modals';

// Use the modal in your plugin
const modal = new GenericConfirmModal(
    this.app,
    "Confirm Action",
    "Are you sure you want to proceed?",
    () => {
        // Callback for confirmation
        console.log("User confirmed");
    }
);
modal.open();
```

## 📋 Components

- **GenericConfirmModal**: A reusable confirmation modal for user interactions

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

This repository provides:
- ✅ Reusable UI components (modals, etc.)
- ✅ Centralized configuration
- ✅ Easy maintenance with simple commands
- ✅ Compatible with both npm and yarn

## 📁 Structure

```
obsidian-plugin-config/
├── src/
│   ├── index.ts          # Main exports
│   └── modals/
│       ├── index.ts      # Modal exports
│       └── GenericConfirmModal.ts
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔄 Migrating Existing Plugins

To migrate an existing plugin to use this centralized architecture:

### Step 1: Add Dependency
Add to your plugin's `package.json`:
```json
{
  "dependencies": {
    "obsidian-plugin-config": "file:../obsidian-plugin-config"
  }
}
```

### Step 2: Copy Scripts
Copy the entire `scripts/` folder from `obsidian-sample-plugin-modif` to your plugin directory.

### Step 3: Update Package Scripts
Update your `package.json` scripts section:
```json
{
  "scripts": {
    "start": "yarn install && yarn dev",
    "dev": "tsx scripts/esbuild.config.ts",
    "build": "tsx scripts/esbuild.config.ts production",
    "real": "tsx scripts/esbuild.config.ts production -r",
    "acp": "tsx scripts/acp.ts",
    "bacp": "tsx scripts/acp.ts -b",
    "release": "tsx scripts/release.ts",
    "update-version": "tsx scripts/update-version.ts"
  }
}
```

### Step 4: Update TypeScript Config
Make sure your `tsconfig.json` includes the path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./node_modules/*"]
    }
  }
}
```

### Step 5: Install Dependencies
```bash
yarn install  # This will install the config dependency
```

### Step 6: Update Imports
Replace any existing modal imports with:
```typescript
import { GenericConfirmModal } from '@/obsidian-plugin-config/modals';
```

### Future: Automated Migration Script
*Coming soon: A script to automate these migration steps for existing plugins.*

## 🎯 Integration with Plugin Template

This config is designed to work with the `obsidian-sample-plugin-modif` template, which contains all the build scripts and development tools.

The template provides:
- ✅ All build and development scripts
- ✅ Pre-configured package.json
- ✅ TypeScript configuration with path mapping
- ✅ Ready-to-use project structure

## 📄 License

MIT