#!/usr/bin/env tsx

console.log(`
Obsidian Plugin Config - Command Reference
(Run these commands from obsidian-plugin-config directory)

MIGRATION:
  yarn migrate-config, m <path>    Migrate plugin to centralized architecture
  yarn migrate-config --dry-run    Preview changes without applying (debugging)
  yarn migrate-config --interactive Interactive plugin selection

MAINTENANCE:
  yarn start                       Install dependencies and update exports
  yarn update-exports              Update package.json exports
  yarn acp                         Add, commit, and push changes
  yarn update-version, v           Update version in centralized config
  yarn help, h                     Show this help

USAGE EXAMPLES:
  yarn migrate-config "C:\\Users\\dev\\plugins\\my-plugin"
  yarn migrate-config ../existing-plugin --dry-run

PATH CONVENTIONS:
  - Windows absolute paths: Use quotes "C:\\path\\to\\plugin"
  - Relative paths: No quotes needed ../plugin-name

For detailed documentation: ARCHITECTURE-SUMMARY.md
`);
