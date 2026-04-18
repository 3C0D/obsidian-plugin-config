#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Quick Help
Global CLI injection tool for Obsidian plugins

═══════════════════════════════════════════════════════════════════

📋 DEVELOPMENT COMMANDS

GIT & VERSION:
  yarn acp                        # Add, commit, push
  yarn v, update-version          # Update version

LINTING:
  yarn lint, lint:fix             # ESLint verification/correction

INJECTION (local testing):
  yarn inject-prompt              # Interactive injection
  yarn inject-path <path>         # Direct injection
  yarn inject <path> --sass       # Injection with SASS support
  yarn check-plugin <path>        # Verification only (dry-run)

NPM PUBLISHING:
  yarn npm-publish                # Full workflow (5 steps):
                                  # 1. version bump
                                  # 2. generate bin
                                  # 3. verify package
                                  # 4. commit + push
                                  # 5. publish to NPM

HELP:
  yarn h                    # This help

═══════════════════════════════════════════════════════════════════

🏗️  ARCHITECTURE

PURE INJECTION TOOL:
  templates/                      # Files to inject into target plugins
  scripts/inject-*.ts             # Injection logic
  bin/obsidian-inject.js          # Global CLI entry point

templates/ → what gets injected:
  templates/package.json          # Base deps/scripts for target plugins
  templates/package-sass.json     # Extra deps when --sass is used
  templates/tsconfig.json         # TypeScript config
  templates/scripts/*             # Scripts copied to target
  templates/eslint.config.mts     # ESLint config
  templates/.github/workflows/*   # GitHub Actions

inject-core.ts — shared injection logic:
  updatePackageJson()             # Merges template package.json
  injectScripts()                 # Copies template files to target
  performInjection()              # Main orchestration

inject-path.ts — CLI entry point:
  Parses --yes, --dry-run, --sass flags

inject-prompt.ts — interactive entry:
  Prompts for target path

═══════════════════════════════════════════════════════════════════

🔧 WORKFLOWS

Development:
  1. Make changes to templates/ or scripts/
  2. yarn lint:fix                # Fix code issues
  3. yarn npm-publish             # Version, commit, publish

Global CLI Usage:
  obsidian-inject                 # Inject in current dir
  obsidian-inject ../my-plugin    # Inject by path
  obsidian-inject ../my-plugin --sass  # With SASS
  obsidian-inject --help          # Show help

Local Testing:
  yarn inject-prompt              # Interactive
  yarn inject-path ../my-plugin   # Direct
  yarn check-plugin ../my-plugin  # Dry-run

SASS Support (--sass flag):
  ✅ esbuild-sass-plugin dependency
  ✅ Automatic .scss detection (src/styles.scss priority)
  ✅ CSS cleanup after compilation

═══════════════════════════════════════════════════════════════════

`);
