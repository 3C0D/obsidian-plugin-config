#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Quick Help
Injection system for autonomous Obsidian plugins

═══════════════════════════════════════════════════════════════════

📋 PLUGIN CONFIG COMMANDS

INSTALLATION & SETUP:
  yarn i                          # Install dependencies
  yarn update-exports, ue         # Update package.json exports

GIT & VERSION MANAGEMENT:
  yarn acp                        # Add, commit, push (with Git sync)
  yarn bacp                       # Build + add, commit, push
  yarn v, update-version          # Update version (package.json + versions.json)

BUILD & TESTING:
  yarn build                      # TypeScript check (no build needed)
  yarn dev                        # Start development mode (watch)
  yarn real                       # Build for production to real vault
  yarn lint, lint:fix             # ESLint verification/correction

INJECTION (Development phase):
  yarn inject-prompt <path>       # Interactive injection (recommended)
  yarn inject-path <path> --yes   # Direct injection with auto-confirm
  yarn inject-sass <path> --yes   # Injection with SASS support
  yarn inject, check-plugin       # Injection shortcuts

NPM PUBLISHING:
  yarn npm-publish                # Complete NPM workflow (exports + bin + publish)
  yarn build-npm                  # Alias for npm-publish

HELP:
  yarn help, h                    # This help

═══════════════════════════════════════════════════════════════════

🔧 DEVELOPMENT WORKFLOWS

Plugin Config Development:
  1. yarn i                        # Install dependencies
  2. yarn update-exports            # Update exports
  3. yarn dev                      # Test as plugin (optional)
  4. yarn lint:fix                 # Fix code issues
  5. yarn v                        # Update version + commit + push
  6. yarn npm-publish              # Publish to NPM

Injection Usage (Development phase):
  Recommended structure:
    my-plugins/
    ├── obsidian-plugin-config/     # This repo
    ├── my-plugin-1/
    └── my-plugin-2/

  Usage:
    yarn inject-prompt ../my-plugin  # Interactive (recommended)
    yarn inject-path ../my-plugin    # Direct injection
    yarn inject-sass ../my-plugin    # Injection with SASS support
    yarn check-plugin ../my-plugin   # Verification only

═══════════════════════════════════════════════════════════════════

🚀 COMPLETE WORKFLOWS

STANDARD DEVELOPMENT WORKFLOW:
  1. yarn i                        # Install dependencies
  2. Make changes to obsidian-plugin-config
  3. yarn update-exports            # Update exports if needed
  4. yarn lint:fix                 # Fix any linting issues
  5. yarn v                        # Update version + commit + push GitHub
  6. yarn npm-publish              # Complete NPM workflow

AUTOMATED WORKFLOW (One command):
  yarn npm-publish                 # Does EVERYTHING automatically:
                                   # → Update exports
                                   # → Generate bin/obsidian-inject.js
                                   # → Verify package
                                   # → Publish to NPM

AFTER NPM PUBLISH:
  npm install -g obsidian-plugin-config  # Update global package
  Test injection: cd any-plugin && obsidian-inject

TESTING AS PLUGIN (Optional):
  1. Configure .env with TEST_VAULT and REAL_VAULT paths
  2. yarn dev                      # Watch mode for development
  3. yarn real                     # Install to real vault

═══════════════════════════════════════════════════════════════════

`);

