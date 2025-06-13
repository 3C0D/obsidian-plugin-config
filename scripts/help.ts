#!/usr/bin/env tsx

console.log(`
🎯 Obsidian Plugin Config - Quick Help
Injection system for autonomous Obsidian plugins

═══════════════════════════════════════════════════════════════════

📋 MAIN COMMANDS

INJECTION:
  yarn inject <path> --yes        # Automatic injection
  yarn inject-prompt <path>       # Injection with prompts
  yarn check-plugin <path>        # Verification without injection

DEVELOPMENT:
  yarn acp                        # Add, commit, push (with Git sync)
  yarn bacp                       # Build + add, commit, push
  yarn v, update-version          # Update version
  yarn release, r                 # GitHub release with tag
  yarn build-npm                  # Build NPM package
  yarn lint, lint:fix             # ESLint verification/correction
  yarn run help, h                # This help

═══════════════════════════════════════════════════════════════════

🔧 LOCAL INJECTION

Recommended structure:
  my-plugins/
  ├── obsidian-plugin-config/     # This repo
  ├── my-plugin-1/
  └── my-plugin-2/

Usage:
  yarn inject ../my-plugin --yes
  yarn check-plugin ../my-plugin  # Verification only

═══════════════════════════════════════════════════════════════════

✅ WHAT IS INJECTED

Autonomous scripts:
  ✅ utils.ts, acp.ts, release.ts, update-version.ts
  ✅ esbuild.config.ts, help.ts
  ✅ TypeScript and ESLint configuration
  ✅ GitHub Actions workflows (Yarn)
  ✅ Automatic Git sync verification

Result: 100% autonomous plugin, no external dependencies

═══════════════════════════════════════════════════════════════════

📦 NPM WORKFLOW (when stable)

  1. yarn build-npm               # Build package
  2. yarn v                       # Update version
  3. npm publish                  # Publish (requires npm login)

CURRENT VERSION: 1.0.6
`);
