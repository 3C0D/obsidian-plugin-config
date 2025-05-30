#!/usr/bin/env tsx

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configRoot = path.dirname(__dirname);

// CLI arguments
const args = process.argv.slice(2);
const isInteractive = args.includes('--interactive') || args.includes('-i');
const isDryRun = args.includes('--dry-run');
const targetPath = args.find(arg => !arg.startsWith('--') && arg !== '-i');

console.log('🚀 Obsidian Plugin Migration Tool');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
}

// Interactive mode for path selection
async function selectPluginPath(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n📁 Enter plugin path:');
    console.log('Examples:');
    console.log('  ../obsidian-vault-name-in-status-bar');
    console.log('  "C:\\path\\to\\plugin"');
    console.log('  /home/user/plugins/my-plugin');

    rl.question('\nPlugin path: ', (answer) => {
      rl.close();
      resolve(answer.trim().replace(/['"]/g, ''));
    });
  });
}

// Validate if directory is an Obsidian plugin
function validateObsidianPlugin(pluginPath: string): boolean {
  const manifestPath = path.join(pluginPath, 'manifest.json');
  const packageJsonPath = path.join(pluginPath, 'package.json');
  const srcPath = path.join(pluginPath, 'src');

  if (!fs.existsSync(manifestPath)) {
    console.log('❌ No manifest.json found - not an Obsidian plugin');
    return false;
  }

  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ No package.json found');
    return false;
  }

  if (!fs.existsSync(srcPath)) {
    console.log('❌ No src/ directory found');
    return false;
  }

  return true;
}

// Check if plugin is already migrated
function isAlreadyMigrated(pluginPath: string): boolean {
  const packageJsonPath = path.join(pluginPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return false;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.dependencies?.['obsidian-plugin-config'] !== undefined;
}

// Smart file update functions
function mergeGitignore(existingPath: string, templatePath: string): string {
  const existing = fs.existsSync(existingPath) ? fs.readFileSync(existingPath, 'utf8') : '';
  const template = fs.readFileSync(templatePath, 'utf8');

  if (!existing) return template;

  const existingLines = new Set(existing.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')));
  const templateLines = template.split('\n');

  // Add only template lines that don't exist in current file
  const newLines = templateLines.filter(line => {
    const trimmed = line.trim();
    // Skip empty lines and comments, or lines that already exist
    if (!trimmed || trimmed.startsWith('#')) return false;
    return !existingLines.has(trimmed);
  });

  if (newLines.length === 0) return existing;

  let result = existing;
  if (!result.endsWith('\n')) result += '\n';
  result += '\n# Added by centralized config\n';
  result += newLines.join('\n');

  return result;
}

function mergeEnvFile(existingPath: string, templatePath: string): string {
  const existing = fs.existsSync(existingPath) ? fs.readFileSync(existingPath, 'utf8') : '';
  const template = fs.readFileSync(templatePath, 'utf8');

  // Extract required variables from template
  const requiredVars = ['TEST_VAULT', 'REAL_VAULT'];
  const existingVars = new Set();

  // Parse existing variables
  existing.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=/);
    if (match) existingVars.add(match[1]);
  });

  // Add missing required variables
  let result = existing;
  requiredVars.forEach(varName => {
    if (!existingVars.has(varName)) {
      if (result && !result.endsWith('\n')) result += '\n';
      result += `${varName}=\n`;
    }
  });

  return result || template;
}

function mergeVSCodeSettings(existingPath: string, templatePath: string): string {
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  if (!fs.existsSync(existingPath)) {
    return JSON.stringify(template, null, 2);
  }

  const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));

  // Merge settings, template takes precedence for our specific settings
  const merged = { ...existing, ...template };

  return JSON.stringify(merged, null, 2);
}

function shouldUpdateFile(filePath: string, templatePath: string, fileName: string): boolean {
  // Always update these files
  const alwaysUpdate = ['.npmrc'];
  if (alwaysUpdate.includes(fileName)) return true;

  // Special logic for tsconfig.json: update if target < ES2018
  if (fileName === 'tsconfig.json' && fs.existsSync(filePath)) {
    try {
      const existingConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const target = existingConfig.compilerOptions?.target;

      // List of targets that are < ES2018
      const oldTargets = ['ES3', 'ES5', 'ES6', 'ES2015', 'ES2016', 'ES2017'];

      if (target && oldTargets.includes(target.toUpperCase())) {
        console.log(`  ⚠️  Updating tsconfig.json: target "${target}" → "ES2018" (required for modern regex support)`);
        return true;
      }

      // If target is ES2018+ or not specified, preserve existing
      return false;
    } catch (error) {
      // If we can't parse the existing tsconfig, update it
      console.log(`  ⚠️  Updating tsconfig.json: invalid JSON detected`);
      return true;
    }
  }

  // Never overwrite these files if they exist (except tsconfig.json handled above)
  const neverOverwrite = ['eslint.config.ts'];
  if (neverOverwrite.includes(fileName) && fs.existsSync(filePath)) {
    return false;
  }

  return true;
}

// Analyze plugin for migration
function analyzePlugin(pluginPath: string) {
  const packageJsonPath = path.join(pluginPath, 'package.json');
  const scriptsPath = path.join(pluginPath, 'scripts');
  const nodeModulesPath = path.join(pluginPath, 'node_modules');
  const packageLockPath = path.join(pluginPath, 'package-lock.json');

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const devDeps = packageJson.devDependencies || {};
  const totalDeps = Object.keys(devDeps).length;

  // Count redundant dependencies (those that exist in centralized config)
  const centralizedDeps = [
    '@types/fs-extra', '@types/semver', 'builtin-modules', 'cross-env',
    'dedent', 'dotenv', 'esbuild', 'fs-extra', 'semver', 'tsx'
  ];
  const redundantDeps = Object.keys(devDeps).filter(dep => centralizedDeps.includes(dep));

  console.log('\n🔍 Plugin Analysis:');
  console.log(`📦 Total dependencies: ${totalDeps}`);
  console.log(`🗑️  Redundant dependencies: ${redundantDeps.length}`);
  console.log(`📁 Local scripts folder: ${fs.existsSync(scriptsPath) ? 'Yes' : 'No'}`);
  console.log(`📦 NPM lock file: ${fs.existsSync(packageLockPath) ? 'Yes (will be removed)' : 'No'}`);

  const hasNodeModules = fs.existsSync(nodeModulesPath);
  const hasPackageLock = fs.existsSync(packageLockPath);
  if (hasNodeModules) {
    if (hasPackageLock) {
      console.log(`📁 node_modules: Yes (will be removed - npm/yarn conflict)`);
    } else {
      console.log(`📁 node_modules: Yes (will be preserved)`);
    }
  } else {
    console.log(`📁 node_modules: No`);
  }

  return {
    totalDeps,
    redundantDeps: redundantDeps.length,
    hasScripts: fs.existsSync(scriptsPath),
    hasPackageLock: fs.existsSync(packageLockPath),
    hasNodeModules: fs.existsSync(nodeModulesPath)
  };
}

// Create backup
function createBackup(pluginPath: string): string {
  const backupPath = `${pluginPath}-backup-${Date.now()}`;
  if (!isDryRun) {
    fs.copySync(pluginPath, backupPath);
    console.log(`💾 Backup created: ${path.basename(backupPath)}`);
  } else {
    console.log(`💾 Would create backup: ${path.basename(backupPath)}`);
  }
  return backupPath;
}

// Perform the actual migration
async function performMigration(pluginPath: string): Promise<void> {
  const packageJsonPath = path.join(pluginPath, 'package.json');
  const scriptsPath = path.join(pluginPath, 'scripts');
  const nodeModulesPath = path.join(pluginPath, 'node_modules');
  const packageLockPath = path.join(pluginPath, 'package-lock.json');
  const envPath = path.join(pluginPath, '.env');

  // Check if already migrated to avoid removing node_modules
  const alreadyMigrated = isAlreadyMigrated(pluginPath);

  // Step 1: Remove old files and folders
  console.log('🗑️  Cleaning old files...');

  if (!isDryRun) {
    if (fs.existsSync(scriptsPath)) {
      fs.removeSync(scriptsPath);
      console.log('  ✅ Removed scripts/ folder');
    }

    // Only remove node_modules if package-lock.json exists (npm/yarn conflict) AND not already migrated
    if (!alreadyMigrated && fs.existsSync(packageLockPath) && fs.existsSync(nodeModulesPath)) {
      fs.removeSync(nodeModulesPath);
      console.log('  ✅ Removed node_modules/ folder (npm/yarn conflict detected)');
    } else if (alreadyMigrated && fs.existsSync(nodeModulesPath)) {
      console.log('  ⏭️  Skipped node_modules/ (already migrated)');
    } else if (!fs.existsSync(packageLockPath) && fs.existsSync(nodeModulesPath)) {
      console.log('  ⏭️  Kept node_modules/ (no package manager conflict)');
    }

    if (fs.existsSync(packageLockPath)) {
      fs.removeSync(packageLockPath);
      console.log('  ✅ Removed package-lock.json');
    }
  } else {
    if (fs.existsSync(scriptsPath)) console.log('  🔍 Would remove scripts/ folder');
    if (!alreadyMigrated && fs.existsSync(packageLockPath) && fs.existsSync(nodeModulesPath)) {
      console.log('  🔍 Would remove node_modules/ folder (npm/yarn conflict detected)');
    } else if (alreadyMigrated && fs.existsSync(nodeModulesPath)) {
      console.log('  🔍 Would skip node_modules/ (already migrated)');
    } else if (!fs.existsSync(packageLockPath) && fs.existsSync(nodeModulesPath)) {
      console.log('  🔍 Would keep node_modules/ (no package manager conflict)');
    }
    if (fs.existsSync(packageLockPath)) console.log('  🔍 Would remove package-lock.json');
  }

  // Step 2: Update package.json
  console.log('📦 Updating package.json...');

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Calculate relative path from plugin to config
  const relativePath = path.relative(pluginPath, configRoot).replace(/\\/g, '/');

  // Add centralized dependency
  if (!packageJson.dependencies) packageJson.dependencies = {};
  packageJson.dependencies['obsidian-plugin-config'] = `file:${relativePath}`;

  // Load centralized versions and scripts
  const centralConfig = JSON.parse(fs.readFileSync(path.join(configRoot, 'templates/package-versions.json'), 'utf8'));

  // Replace all scripts with centralized ones
  packageJson.scripts = centralConfig.scripts;

  // Clean redundant devDependencies (only esbuild since it's provided by centralized config)
  const redundantDeps = [
    'esbuild'
  ];

  if (packageJson.devDependencies) {
    redundantDeps.forEach(dep => {
      if (packageJson.devDependencies[dep]) {
        delete packageJson.devDependencies[dep];
      }
    });
  }

  // Ensure minimal devDependencies exist with centralized versions
  if (!packageJson.devDependencies) packageJson.devDependencies = {};

  Object.entries(centralConfig.devDependencies).forEach(([dep, version]) => {
    packageJson.devDependencies[dep] = version; // Always update to centralized version
  });

  // Add yarn protection from centralized config
  packageJson.engines = centralConfig.engines;

  if (!isDryRun) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('  ✅ Updated package.json');

    // Install dependencies if node_modules was removed
    if (!alreadyMigrated && !fs.existsSync(nodeModulesPath)) {
      console.log('📦 Installing dependencies...');
      try {
        const { execSync } = require('child_process');
        execSync('yarn install', { cwd: pluginPath, stdio: 'inherit' });
        console.log('  ✅ Dependencies installed');
      } catch (error) {
        console.log('  ⚠️  Failed to install dependencies automatically. Please run "yarn install" manually.');
      }
    }
  } else {
    console.log('  🔍 Would update package.json');
    if (!alreadyMigrated && !fs.existsSync(nodeModulesPath)) {
      console.log('  🔍 Would install dependencies after node_modules removal');
    }
  }

  // Step 3: Smart update of configuration files
  console.log('📋 Updating configuration files...');

  const templateFiles = [
    { source: 'templates/eslint.config.ts', target: 'eslint.config.ts', merge: false },
    { source: 'templates/tsconfig.json', target: 'tsconfig.json', merge: false },
    { source: 'templates/.npmrc', target: '.npmrc', merge: false },
    { source: 'templates/.vscode/settings.json', target: '.vscode/settings.json', merge: 'vscode' },
    { source: 'templates/.gitignore', target: '.gitignore', merge: 'gitignore' }
  ];

  for (const file of templateFiles) {
    const sourcePath = path.join(configRoot, file.source);
    const targetPath = path.join(pluginPath, file.target);
    const fileName = path.basename(file.target);

    if (!shouldUpdateFile(targetPath, sourcePath, fileName)) {
      console.log(`  ⏭️  Skipped ${file.target} (preserving existing)`);
      continue;
    }

    if (!isDryRun) {
      // Create target directory if needed
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      let content: string;
      if (file.merge === 'gitignore') {
        content = mergeGitignore(targetPath, sourcePath);
      } else if (file.merge === 'vscode') {
        content = mergeVSCodeSettings(targetPath, sourcePath);
      } else {
        content = fs.readFileSync(sourcePath, 'utf8');
      }

      fs.writeFileSync(targetPath, content);

      if (fs.existsSync(targetPath) && file.merge) {
        console.log(`  ✅ Merged ${file.target}`);
      } else {
        console.log(`  ✅ Updated ${file.target}`);
      }
    } else {
      if (file.merge && fs.existsSync(targetPath)) {
        console.log(`  🔍 Would merge ${file.target}`);
      } else {
        console.log(`  🔍 Would update ${file.target}`);
      }
    }
  }

  // Step 4: Smart update of .env file
  console.log('📝 Updating .env file...');

  const envTemplatePath = path.join(configRoot, 'templates/.env');

  if (!isDryRun) {
    const envContent = mergeEnvFile(envPath, envTemplatePath);
    fs.writeFileSync(envPath, envContent);

    if (fs.existsSync(envPath)) {
      console.log('  ✅ Updated .env file (preserved existing variables)');
    } else {
      console.log('  ✅ Created .env file');
    }
    console.log('  ⚠️  Please verify .env contains your vault paths');
  } else {
    if (fs.existsSync(envPath)) {
      console.log('  🔍 Would update .env file (preserving existing variables)');
    } else {
      console.log('  🔍 Would create .env file');
    }
  }
}

async function main(): Promise<void> {
  try {
    let pluginPath: string;

    if (isInteractive) {
      pluginPath = await selectPluginPath();
    } else if (targetPath) {
      pluginPath = targetPath;
    } else {
      console.log('❌ Please provide a plugin path or use --interactive');
      console.log('Usage: yarn migrate <path> [--dry-run]');
      console.log('       yarn migrate -i, --interactive');
      process.exit(1);
    }

    // Resolve path
    pluginPath = path.resolve(pluginPath);
    console.log(`\n📁 Target plugin: ${pluginPath}`);

    // Validate plugin directory
    if (!fs.existsSync(pluginPath)) {
      console.log('❌ Plugin directory does not exist');
      process.exit(1);
    }

    if (!validateObsidianPlugin(pluginPath)) {
      process.exit(1);
    }

    console.log('✅ Valid Obsidian plugin detected');

    // Check if already migrated
    const alreadyMigrated = isAlreadyMigrated(pluginPath);
    if (alreadyMigrated) {
      console.log('ℹ️  Plugin already migrated - will update configuration only');
    }

    // Analyze plugin
    const analysis = analyzePlugin(pluginPath);

    // Show migration plan
    console.log('\n🎯 Migration Plan:');
    console.log('  ✅ Add centralized dependency');
    console.log('  ✅ Update package.json scripts');
    console.log('  ✅ Smart update configuration files (preserve customizations)');
    if (analysis.hasScripts) console.log('  🗑️  Remove local scripts/ folder');

    // Node modules logic
    if (!alreadyMigrated && analysis.hasPackageLock && analysis.hasNodeModules) {
      console.log('  🗑️  Remove node_modules/ (npm/yarn conflict detected)');
    } else if (alreadyMigrated && analysis.hasNodeModules) {
      console.log('  ⏭️  Keep node_modules/ (already migrated)');
    } else if (!analysis.hasPackageLock && analysis.hasNodeModules) {
      console.log('  ⏭️  Keep node_modules/ (no package manager conflict)');
    }

    if (analysis.hasPackageLock) console.log('  🗑️  Remove package-lock.json');
    console.log(`  🗑️  Remove ${analysis.redundantDeps} redundant dependencies`);

    if (!isDryRun) {
      // Confirm migration
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const proceed = await new Promise<boolean>((resolve) => {
        rl.question('\nProceed with migration? [Y/n]: ', (answer) => {
          rl.close();
          const response = answer.trim().toLowerCase();
          // Accept: y, yes, Y, YES, or empty (default to yes)
          // Reject: n, no, N, NO
          const isYes = response === '' || response === 'y' || response === 'yes';
          const isNo = response === 'n' || response === 'no';

          if (isNo) {
            resolve(false);
          } else if (isYes) {
            resolve(true);
          } else {
            console.log('Please answer Y (yes) or n (no)');
            // For invalid input, default to no for safety
            resolve(false);
          }
        });
      });

      if (!proceed) {
        console.log('Migration cancelled');
        process.exit(0);
      }

      // Create backup - DISABLED in production
      // createBackup(pluginPath);
    }

    console.log('\n🔄 Starting migration...');

    // Perform actual migration
    await performMigration(pluginPath);

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
