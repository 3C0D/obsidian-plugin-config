# Obsidian Plugin Config

Centralized configuration and reusable components for Obsidian plugin development.

## 📦 Installation

```bash
# In your plugin directory
npm install ../obsidian-plugin-config
# or
yarn add file:../obsidian-plugin-config
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

## 🎯 Integration with Plugin Template

This config is designed to work with the `obsidian-sample-plugin-modif` template, which contains all the build scripts and development tools.

## 📄 License

MIT