#!/usr/bin/env tsx

console.log(`
Obsidian Plugin Development - Command Reference
(Run these commands from your plugin directory)

DEVELOPMENT:
  yarn start                       Install dependencies and start development
  yarn dev                         Build in development mode with hot reload
  yarn build                       Build for production
  yarn real                        Build and install in real Obsidian vault

VERSION MANAGEMENT:
  yarn update-version, v           Update plugin version in package.json and manifest.json
  yarn release, r                  Create release with automated changelog

GIT OPERATIONS:
  yarn acp                         Add, commit, and push changes
  yarn bacp                        Build + add, commit, and push

MAINTENANCE:
  yarn update-exports              Update package.json exports when importing from plugin-config

USAGE EXAMPLES:
  yarn start                       # First time setup
  yarn dev                         # Daily development
  yarn real                        # Build and test in real vault
  yarn update-version              # Update version before release
  yarn release                     # Publish new version

ENVIRONMENT:
  - Edit .env file to set TEST_VAULT and REAL_VAULT paths
  - All scripts use centralized configuration from obsidian-plugin-config

CENTRALIZED ARCHITECTURE:
  - Scripts are centralized in obsidian-plugin-config repository
  - Configuration files (tsconfig, eslint) extend centralized templates
  - Dependencies are managed centrally for consistency
  - Run 'cd ../obsidian-plugin-config && yarn help' for migration commands

For detailed documentation: ../obsidian-plugin-config/ARCHITECTURE-SUMMARY.md
`);
