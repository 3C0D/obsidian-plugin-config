#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Quick Help
Injection system for autonomous Obsidian plugins

═══════════════════════════════════════════════════════════════════

📋 PLUGIN CONFIG COMMANDS

INSTALLATION & SETUP:
  yarn i, install                 # Install dependencies
  yarn update-exports, ue         # Update package.json exports

GIT & VERSION MANAGEMENT:
  yarn acp                        # Add, commit, push
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
  yarn inject <path> --sass       # Injection with SASS support
  yarn check-plugin <path>        # Verification only (dry-run)

NPM PUBLISHING (all-in-one - no acp needed before):
  yarn npm-publish                # Full workflow (7 steps):
                                  # 0. NPM auth check
                                  # 1. version bump
                                  # 2. update exports
                                  # 3. generate bin
                                  # 4. verify package
                                  # 5. commit + push
                                  # 6. publish to NPM
                                  # 7. offer global CLI update
  yarn build-npm                  # Alias for npm-publish

UPGRADE:
  yarn upgrade-all                # yarn upgrade + sync template deps

HELP:
  yarn help, h                    # This help

═══════════════════════════════════════════════════════════════════

📦 EXPORTS SYSTEM

The package exposes a single entry point:
  obsidian-plugin-config          # Main entry — re-exports all modules

Src modules (auto-exported via src/index.ts):
  modals, tools, utils

After adding a new module to src/, run:
  yarn update-exports             # Regenerates src/index.ts

═══════════════════════════════════════════════════════════════════

🏗️  ARCHITECTURE

TWO DISTINCT ROLES:
  Root (src/, scripts/)           # Local plugin + NPM snippet exports
  templates/                      # Source of truth for injection

templates/ → what gets injected:
  templates/package.json          # Base deps/scripts for target plugins
  templates/package-sass.json     # Extra deps when --sass is used
  templates/tsconfig.json         # TypeScript config for target plugins
  templates/scripts/*             # Scripts copied to <target>/scripts/
  templates/eslint.config.mts     # ESLint config for target plugins

inject-core.ts — shared injection logic:
  updatePackageJson()             # Reads templates/package.json (not hardcoded)
  injectScripts()                 # Copies templates/ files to target
  performInjection()              # Main orchestration function

inject-path.ts — CLI entry point:
  Parses --yes, --dry-run, --sass flags

inject-prompt.ts — interactive entry point:
  Prompts for target path interactively

═══════════════════════════════════════════════════════════════════

🔧 DEVELOPMENT WORKFLOWS

Plugin Config Development:
  1. yarn i                       # Install dependencies
  2. yarn update-exports          # Update exports
  3. yarn dev                     # Test as plugin (optional)
  4. yarn lint:fix                # Fix code issues
  5. yarn v                       # Update version + commit + push
  6. yarn npm-publish             # Publish to NPM

Injection Usage:
  Usage (from plugin directory or by path):
    obsidian-inject               # Inject in current dir
    obsidian-inject ../my-plugin  # Inject by path
    obsidian-inject ../my-plugin --sass  # With SASS

  Or with local yarn commands:
    yarn inject-prompt            # Interactive
    yarn inject-path ../my-plugin # Direct injection
    yarn check-plugin ../my-plugin # Dry-run only

SASS Support (--sass flag):
  What gets added to the target plugin:
    ✅ esbuild-sass-plugin dependency
    ✅ Automatic .scss file detection (src/styles.scss priority)
    ✅ CSS cleanup after compilation

  The standard esbuild.config.ts handles SASS via dynamic import —
  no separate template needed.

═══════════════════════════════════════════════════════════════════

🚀 COMPLETE WORKFLOWS

STANDARD DEVELOPMENT WORKFLOW:
  1. yarn i                       # Install dependencies
  2. Make changes to src/ or templates/
  3. yarn lint:fix                # Fix any linting issues
  4. yarn npm-publish             # Does EVERYTHING:
                                  # → Ask for version bump type
                                  # → Update exports
                                  # → Generate bin file
                                  # → Verify package
                                  # → Commit + push to GitHub
                                  # → Publish to NPM

  Note: yarn acp is only needed for intermediate commits
  (not required before npm-publish).

AFTER NPM PUBLISH - Update global CLI:
  npm install -g obsidian-plugin-config@latest
  obsidian-inject                 # Test in current plugin dir
  obsidian-inject ../test-plugin --sass

TESTING AS PLUGIN (Optional):
  1. Configure .env with TEST_VAULT and REAL_VAULT paths
  2. yarn dev                     # Watch mode for development
  3. yarn real                    # Install to real vault

═══════════════════════════════════════════════════════════════════

`);
