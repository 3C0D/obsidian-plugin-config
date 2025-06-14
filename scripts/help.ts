#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Quick Help
Injection system for autonomous Obsidian plugins

═══════════════════════════════════════════════════════════════════

📋 PLUGIN CONFIG COMMANDS

DEVELOPMENT:
  yarn start, i                   # Install dependencies + update exports
  yarn update-exports, ue         # Update package.json exports
  yarn build                      # TypeScript check (no build needed)
  yarn lint, lint:fix             # ESLint verification/correction

INJECTION:
  yarn inject-prompt <path>       # Interactive injection (recommended)
  yarn inject-path <path> --yes   # Direct injection with auto-confirm
  yarn check-plugin <path>        # Verification without injection

GIT & VERSION:
  yarn acp                        # Add, commit, push (with Git sync)
  yarn bacp                       # Build + add, commit, push
  yarn v, update-version          # Update version (package.json + versions.json)

NPM PUBLISHING:
  yarn npm-publish                # Complete NPM workflow (exports + bin + publish)
  yarn build-npm                  # Alias for npm-publish

HELP:
  yarn run help, h                # This help

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

🚀 COMPLETE WORKFLOW (Development → GitHub → NPM)

  1. Make changes to obsidian-plugin-config
  2. yarn lint:fix                 # Fix any linting issues
  3. yarn v                        # Update version (package.json + versions.json + push)
  4. yarn bacp                     # Commit and push changes to GitHub
  5. yarn npm-publish              # Complete NPM workflow (exports + bin + publish)
  6. npm install -g obsidian-plugin-config  # Update global package
  7. Test injection: cd any-plugin && obsidian-inject

SIMPLE NPM WORKFLOW:
  yarn npm-publish                 # One command does everything:
                                   # → Update exports
                                   # → Generate bin/obsidian-inject.js
                                   # → Verify package
                                   # → Publish to NPM

═══════════════════════════════════════════════════════════════════

`);

