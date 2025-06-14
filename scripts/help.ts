#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Quick Help
Injection system for autonomous Obsidian plugins

═══════════════════════════════════════════════════════════════════

📋 PLUGIN CONFIG COMMANDS

DEVELOPMENT:
  yarn start                      # Install dependencies + update exports
  yarn build                      # Build the project
  yarn dev                        # Development build
  yarn real                       # Build to real vault

INJECTION:
  yarn inject-path <path> --yes   # Automatic injection
  yarn inject-prompt <path>       # Interactive injection with prompts
  yarn check-plugin <path>        # Verification without injection

GIT & VERSION:
  yarn acp                        # Add, commit, push
  yarn bacp                       # Build + add, commit, push
  yarn v, update-version          # Update version

NPM PUBLISHING:
  yarn build-npm                  # Build NPM package
  yarn publish-npm                # Publish to NPM

═══════════════════════════════════════════════════════════════════

🔧 INJECTION USAGE

Recommended structure:
  my-plugins/
  ├── obsidian-plugin-config/     # This repo
  ├── my-plugin-1/
  └── my-plugin-2/

Usage:
  yarn inject-prompt ../my-plugin  # Interactive (recommended)
  yarn inject-path ../my-plugin    # Direct injection
  yarn check-plugin ../my-plugin   # Verification only

═══════════════════════════════════════════════════════════════════

`);

