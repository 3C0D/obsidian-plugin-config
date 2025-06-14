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

🚀 COMPLETE WORKFLOWS

DEVELOPMENT WORKFLOW (Manual control):
  1. Make changes to obsidian-plugin-config
  2. yarn lint:fix                 # Fix any linting issues
  3. yarn v                        # Update version + commit + push GitHub
  4. yarn bacp                     # Commit other changes + push GitHub
  5. yarn npm-publish              # Complete NPM workflow

AUTOMATED WORKFLOW (One command):
  yarn npm-publish                 # Does EVERYTHING automatically:
                                   # → Update version (patch)
                                   # → Commit and push to GitHub
                                   # → Update exports
                                   # → Generate bin/obsidian-inject.js
                                   # → Verify package
                                   # → Publish to NPM

AFTER NPM PUBLISH:
  npm install -g obsidian-plugin-config  # Update global package
  Test injection: cd any-plugin && obsidian-inject

═══════════════════════════════════════════════════════════════════

`);

