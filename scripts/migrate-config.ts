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
  console.log(`📁 node_modules: ${fs.existsSync(nodeModulesPath) ? 'Yes (will be removed)' : 'No'}`);

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

    // Only remove node_modules if not already migrated
    if (!alreadyMigrated && fs.existsSync(nodeModulesPath)) {
      fs.removeSync(nodeModulesPath);
      console.log('  ✅ Removed node_modules/ folder');
    } else if (alreadyMigrated && fs.existsSync(nodeModulesPath)) {
      console.log('  ⏭️  Skipped node_modules/ (already migrated)');
    }

    if (fs.existsSync(packageLockPath)) {
      fs.removeSync(packageLockPath);
      console.log('  ✅ Removed package-lock.json');
    }
  } else {
    if (fs.existsSync(scriptsPath)) console.log('  🔍 Would remove scripts/ folder');
    if (!alreadyMigrated && fs.existsSync(nodeModulesPath)) {
      console.log('  🔍 Would remove node_modules/ folder');
    } else if (alreadyMigrated && fs.existsSync(nodeModulesPath)) {
      console.log('  🔍 Would skip node_modules/ (already migrated)');
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

  // Clean redundant devDependencies
  const redundantDeps = [
    '@types/fs-extra', '@types/semver', 'builtin-modules', 'cross-env',
    'dedent', 'dotenv', 'esbuild', 'fs-extra', 'semver', 'tsx'
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
  } else {
    console.log('  🔍 Would update package.json');
  }

  // Step 3: Copy configuration templates
  console.log('📋 Copying configuration templates...');

  const templateFiles = [
    { source: 'templates/eslint.config.ts', target: 'eslint.config.ts' },
    { source: 'templates/tsconfig.json', target: 'tsconfig.json' },
    { source: 'templates/.npmrc', target: '.npmrc' },
    { source: 'templates/.vscode/settings.json', target: '.vscode/settings.json' },
    { source: 'templates/.gitignore', target: '.gitignore' }
  ];

  for (const file of templateFiles) {
    const sourcePath = path.join(configRoot, file.source);
    const targetPath = path.join(pluginPath, file.target);

    if (!isDryRun) {
      // Create target directory if needed
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ Copied ${file.target}`);
    } else {
      console.log(`  🔍 Would copy ${file.target}`);
    }
  }

  // Step 4: Handle .env file
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');

    if (!isDryRun) {
      const envContent = `# Environment variables for plugin development
# Update these paths to match your setup

# Path to test vault (for development)
TEST_VAULT=

# Path to real vault (for production testing)
REAL_VAULT=

# Note: Run 'yarn version' to update these paths interactively
`;
      fs.writeFileSync(envPath, envContent);
      console.log('  ✅ Created .env file');
      console.log('  ⚠️  Please update .env with your vault paths');
    } else {
      console.log('  🔍 Would create .env file');
    }
  } else {
    console.log('  ✅ .env file already exists');
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
    console.log('  ✅ Copy configuration templates');
    if (analysis.hasScripts) console.log('  🗑️  Remove local scripts/ folder');
    if (!alreadyMigrated && analysis.hasNodeModules) console.log('  🗑️  Remove node_modules/ folder');
    if (alreadyMigrated && analysis.hasNodeModules) console.log('  ⏭️  Keep node_modules/ (already migrated)');
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

      // Create backup
      createBackup(pluginPath);
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
