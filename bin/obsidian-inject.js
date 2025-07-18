#!/usr/bin/env node

/**
 * Obsidian Plugin Config - CLI Entry Point
 * Global command: obsidian-inject
 * Version: 1.1.20
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute, resolve } from 'path';
import fs from 'fs';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = dirname(__dirname);

// Path to the injection script
const injectScriptPath = join(packageRoot, 'scripts', 'inject-path.ts');

function showHelp() {
  console.log(`
Obsidian Plugin Config - Global CLI
Injection system for autonomous Obsidian plugins

USAGE:
  obsidian-inject                    # Inject in current directory
  obsidian-inject <path>             # Inject by path
  obsidian-inject <path> --sass      # Inject with SASS support
  obsidian-inject --help, -h         # Show this help

EXAMPLES:
  cd my-plugin && obsidian-inject
  obsidian-inject ../my-other-plugin
  obsidian-inject ../my-plugin --sass
  obsidian-inject "C:\\Users\\dev\\plugins\\my-plugin"

WHAT IS INJECTED:
  ✅ Local scripts (esbuild.config.ts, acp.ts, utils.ts, etc.)
  ✅ Package.json configuration (scripts, dependencies)
  ✅ Yarn protection enforced
  ✅ Automatic dependency installation
  🎨 SASS support (with --sass option): esbuild-sass-plugin + SCSS compilation

ARCHITECTURE:
  - Plugin becomes AUTONOMOUS with local scripts
  - No external dependencies required after injection
  - Updates possible via re-injection

More info: https://github.com/3C0D/obsidian-plugin-config
`);
}

function main() {
  const args = process.argv.slice(2);

  // Handle help flags
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Check if injection script exists
  if (!fs.existsSync(injectScriptPath)) {
    console.error(`❌ Error: Injection script not found at ${injectScriptPath}`);
    console.error(`   Make sure obsidian-plugin-config is properly installed.`);
    process.exit(1);
  }

  // Parse arguments
  const sassFlag = args.includes('--sass');
  const pathArg = args.find(arg => !arg.startsWith('-'));

  // Determine target path (resolve relative to user's current directory)
  const userCwd = process.cwd();
  let targetPath = pathArg || userCwd;

  // If relative path, resolve from user's current directory
  if (pathArg && !isAbsolute(pathArg)) {
    targetPath = resolve(userCwd, pathArg);
  }

  console.log(`🎯 Obsidian Plugin Config - Global Injection`);
  console.log(`📁 Target: ${targetPath}`);
  console.log(`🎨 SASS: ${sassFlag ? 'Enabled' : 'Disabled'}`);
  console.log(`📦 From: ${packageRoot}\n`);

  try {
    // Check if target directory has package.json
    const targetPackageJson = join(targetPath, 'package.json');
    if (!fs.existsSync(targetPackageJson)) {
      console.error(`❌ Error: package.json not found in ${targetPath}`);
      console.error(`   Make sure this is a valid Node.js project.`);
      process.exit(1);
    }

    // Clean NPM artifacts if package-lock.json exists
    const packageLockPath = join(targetPath, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      console.log(`🧹 NPM installation detected, cleaning...`);

      try {
        // Remove package-lock.json
        fs.unlinkSync(packageLockPath);
        console.log(`   🗑️  package-lock.json removed`);

        // Remove node_modules if it exists
        const nodeModulesPath = join(targetPath, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          fs.rmSync(nodeModulesPath, { recursive: true, force: true });
          console.log(`   🗑️  node_modules removed (will be reinstalled with Yarn)`);
        }

        console.log(`   ✅ NPM artifacts cleaned to avoid Yarn conflicts`);

      } catch (cleanError) {
        console.error(`   ❌ Cleanup failed:`, cleanError.message);
        console.log(`   💡 Manually remove package-lock.json and node_modules`);
      }
    }

    // Check if tsx is available locally in target
    let tsxCommand = 'npx tsx';
    try {
      execSync('npx tsx --version', {
        cwd: targetPath,
        stdio: 'pipe'
      });
      console.log(`✅ tsx available locally`);
    } catch {
      console.log(`⚠️  tsx not found, installing...`);

      // Install tsx locally in target directory
      try {
        execSync('yarn add -D tsx', {
          cwd: targetPath,
          stdio: 'inherit'
        });
        console.log(`✅ tsx installed successfully`);
      } catch (installError) {
        console.error(`❌ tsx installation failed:`, installError.message);
        console.error(`   Try installing tsx manually: cd "${targetPath}" && yarn add -D tsx`);
        process.exit(1);
      }
    }

    // Execute the injection script with tsx
    const sassOption = sassFlag ? ' --sass' : '';
    const command = `npx tsx "${injectScriptPath}" "${targetPath}" --yes${sassOption}`;

    execSync(command, {
      stdio: 'inherit',
      cwd: targetPath  // Use target directory to ensure tsx is available
    });

    console.log(`\n✅ Injection completed successfully!`);

  } catch (error) {
    console.error(`\n❌ Injection error:`, error.message);
    process.exit(1);
  }
}

// Run the CLI
main();
