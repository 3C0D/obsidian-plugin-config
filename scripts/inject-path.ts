#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";
import {
  askQuestion,
  askConfirmation,
  createReadlineInterface,
  isValidPath
} from "./utils.js";

// Load environment variables from .env file
dotenv.config();

const rl = createReadlineInterface();

interface InjectionPlan {
  targetPath: string;
  isObsidianPlugin: boolean;
  hasPackageJson: boolean;
  hasManifest: boolean;
  hasScriptsFolder: boolean;
  currentDependencies: string[];
}

/**
 * Analyze the target plugin directory
 */
async function analyzePlugin(pluginPath: string): Promise<InjectionPlan> {
  const packageJsonPath = path.join(pluginPath, "package.json");
  const manifestPath = path.join(pluginPath, "manifest.json");
  const scriptsPath = path.join(pluginPath, "scripts");

  const plan: InjectionPlan = {
    targetPath: pluginPath,
    isObsidianPlugin: false,
    hasPackageJson: await isValidPath(packageJsonPath),
    hasManifest: await isValidPath(manifestPath),
    hasScriptsFolder: await isValidPath(scriptsPath),
    currentDependencies: []
  };

  // Check if it's an Obsidian plugin
  if (plan.hasManifest) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      plan.isObsidianPlugin = !!(manifest.id && manifest.name && manifest.version);
    } catch (error) {
      console.warn("Warning: Could not parse manifest.json");
    }
  }

  // Get current dependencies
  if (plan.hasPackageJson) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      plan.currentDependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ];
    } catch (error) {
      console.warn("Warning: Could not parse package.json");
    }
  }

  return plan;
}

/**
 * Display injection plan and ask for confirmation
 */
async function showInjectionPlan(plan: InjectionPlan, autoConfirm: boolean = false): Promise<boolean> {
  console.log(`\n🎯 Injection Plan for: ${plan.targetPath}`);
  console.log(`📁 Target: ${path.basename(plan.targetPath)}`);
  console.log(`📦 Package.json: ${plan.hasPackageJson ? '✅' : '❌'}`);
  console.log(`📋 Manifest.json: ${plan.hasManifest ? '✅' : '❌'}`);
  console.log(`📂 Scripts folder: ${plan.hasScriptsFolder ? '✅ (will be updated)' : '❌ (will be created)'}`);
  console.log(`🔌 Obsidian plugin: ${plan.isObsidianPlugin ? '✅' : '❌'}`);

  if (!plan.isObsidianPlugin) {
    console.log(`\n⚠️  Warning: This doesn't appear to be a valid Obsidian plugin`);
    console.log(`   Missing manifest.json or invalid structure`);
  }

  console.log(`\n📋 Will inject:`);
  console.log(`   ✅ Local scripts (utils.ts, esbuild.config.ts, acp.ts, etc.)`);
  console.log(`   ✅ Updated package.json scripts`);
  console.log(`   ✅ Required dependencies`);
  console.log(`   🔍 Analyze centralized imports (manual commenting may be needed)`);

  if (autoConfirm) {
    console.log(`\n✅ Auto-confirming injection...`);
    return true;
  }

  return await askConfirmation(`\nProceed with injection?`, rl);
}

/**
 * Find plugin-config root directory
 */
function findPluginConfigRoot(): string {
  const envPath = process.env.PLUGIN_CONFIG_PATH?.trim();

  // Option 1: local - check parent directory
  if (envPath === "local") {
    const parentPath = path.resolve(process.cwd(), "../obsidian-plugin-config");
    if (fs.existsSync(parentPath)) {
      return parentPath;
    }
    throw new Error("obsidian-plugin-config not found in parent directory");
  }

  // Option 2: prompt - skip auto-detection
  if (envPath === "prompt") {
    throw new Error("PROMPT_REQUIRED");
  }

  // Option 3: specific path
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  // Option 4: auto-detect parent, fallback to current
  const parentPath = path.resolve(process.cwd(), "../obsidian-plugin-config");
  if (fs.existsSync(parentPath)) {
    return parentPath;
  }

  // Option 5: Check if we're running from NPM package (global installation)
  // Get the directory of this script file
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const npmPackageRoot = path.resolve(scriptDir, "..");

  // Check if we're in an NPM package structure
  const npmPackageJson = path.join(npmPackageRoot, "package.json");
  if (fs.existsSync(npmPackageJson)) {
    try {
      const packageContent = JSON.parse(fs.readFileSync(npmPackageJson, 'utf8'));
      if (packageContent.name === "obsidian-plugin-config") {
        return npmPackageRoot;
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  // Fallback to current directory (original behavior)
  return process.cwd();
}

/**
 * Copy file content from local plugin-config directory
 */
function copyFromLocal(filePath: string): string {
  const configRoot = findPluginConfigRoot();
  const sourcePath = path.join(configRoot, filePath);

  try {
    return fs.readFileSync(sourcePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to copy ${filePath}: ${error}`);
  }
}

/**
 * Inject scripts from local files
 */
async function injectScripts(targetPath: string): Promise<void> {
  const scriptsPath = path.join(targetPath, "scripts");

  // Create scripts directory if it doesn't exist
  if (!await isValidPath(scriptsPath)) {
    fs.mkdirSync(scriptsPath, { recursive: true });
    console.log(`📁 Created scripts directory`);
  }

  const scriptFiles = [
    "scripts/utils.ts",
    "scripts/esbuild.config.ts",
    "scripts/acp.ts",
    "scripts/update-version.ts",
    "scripts/release.ts",
    "scripts/help.ts"
  ];

  const configFiles = [
    "templates/tsconfig.json"
  ];

  console.log(`\n📥 Copying scripts from local files...`);

  for (const scriptFile of scriptFiles) {
    try {
      const content = copyFromLocal(scriptFile);
      const fileName = path.basename(scriptFile);
      const targetFile = path.join(scriptsPath, fileName);

      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`   ✅ ${fileName}`);
    } catch (error) {
      console.error(`   ❌ Failed to inject ${scriptFile}: ${error}`);
    }
  }

  console.log(`\n📥 Copying config files from local files...`);

  for (const configFile of configFiles) {
    try {
      const content = copyFromLocal(configFile);
      const fileName = path.basename(configFile);
      const targetFile = path.join(targetPath, fileName);

      // Force inject tsconfig.json to ensure correct template
      if (fileName === 'tsconfig.json' && await isValidPath(targetFile)) {
        console.log(`   🔄 ${fileName} exists, updating with template`);
      }

      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`   ✅ ${fileName}`);
    } catch (error) {
      console.error(`   ❌ Failed to inject ${configFile}: ${error}`);
    }
  }
}

/**
 * Update package.json with autonomous configuration
 */
async function updatePackageJson(targetPath: string): Promise<void> {
  const packageJsonPath = path.join(targetPath, "package.json");

  if (!await isValidPath(packageJsonPath)) {
    console.log(`❌ No package.json found, skipping package.json update`);
    return;
  }

  try {
    console.log(`   🔍 Reading package.json from: ${packageJsonPath}`);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    console.log(`   🔍 Original package name: ${packageJson.name}`);

    // Update scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "start": "yarn install && yarn dev",
      "dev": "tsx scripts/esbuild.config.ts",
      "build": "tsc -noEmit -skipLibCheck && tsx scripts/esbuild.config.ts production",
      "real": "tsx scripts/esbuild.config.ts production real",
      "acp": "tsx scripts/acp.ts",
      "bacp": "tsx scripts/acp.ts -b",
      "update-version": "tsx scripts/update-version.ts",
      "v": "tsx scripts/update-version.ts",
      "release": "tsx scripts/release.ts",
      "r": "tsx scripts/release.ts",
      "help": "tsx scripts/help.ts",
      "h": "tsx scripts/help.ts"
    };

    // Remove centralized dependency
    if (packageJson.dependencies && packageJson.dependencies["obsidian-plugin-config"]) {
      delete packageJson.dependencies["obsidian-plugin-config"];
      console.log(`   🗑️  Removed obsidian-plugin-config dependency`);
    }

    // Add required dependencies
    if (!packageJson.devDependencies) packageJson.devDependencies = {};

    const requiredDeps = {
      "@types/node": "^22.15.26",
      "@types/semver": "^7.7.0",
      "builtin-modules": "3.3.0",
      "dedent": "^1.6.0",
      "dotenv": "^16.4.5",
      "esbuild": "latest",
      "obsidian": "*",
      "obsidian-typings": "^3.9.5",
      "semver": "^7.7.2",
      "tsx": "^4.19.4",
      "typescript": "^5.8.2"
    };

    // Force update TypeScript to compatible version
    if (packageJson.devDependencies.typescript && packageJson.devDependencies.typescript !== "^5.8.2") {
      console.log(`   🔄 Updating TypeScript from ${packageJson.devDependencies.typescript} to ^5.8.2`);
    }

    let addedDeps = 0;
    let updatedDeps = 0;
    for (const [dep, version] of Object.entries(requiredDeps)) {
      if (!packageJson.devDependencies[dep]) {
        packageJson.devDependencies[dep] = version;
        addedDeps++;
      } else if (packageJson.devDependencies[dep] !== version) {
        packageJson.devDependencies[dep] = version;
        updatedDeps++;
      }
    }

    // Ensure yarn protection
    if (!packageJson.engines) packageJson.engines = {};
    packageJson.engines.npm = "please-use-yarn";
    packageJson.engines.yarn = ">=1.22.0";

    // Ensure ESM module type for modern configuration
    packageJson.type = "module";

    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log(`   ✅ Updated package.json (${addedDeps} new, ${updatedDeps} updated dependencies)`);

    // Debug: verify package.json was written correctly
    console.log(`   🔍 Package name: ${packageJson.name}`);

    // CRITICAL DEBUG: Re-read the file to verify what was actually written
    const verifyContent = fs.readFileSync(packageJsonPath, 'utf8');
    const verifyJson = JSON.parse(verifyContent);
    console.log(`   🔍 VERIFICATION - File actually contains: ${verifyJson.name}`);

  } catch (error) {
    console.error(`   ❌ Failed to update package.json: ${error}`);
  }
}

/**
 * Analyze centralized imports in source files (without modifying)
 */
async function analyzeCentralizedImports(targetPath: string): Promise<void> {
  const srcPath = path.join(targetPath, "src");

  if (!await isValidPath(srcPath)) {
    console.log(`   ℹ️  No src directory found`);
    return;
  }

  console.log(`\n🔍 Analyzing centralized imports...`);

  try {
    // Find all TypeScript files recursively
    const findTsFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...findTsFiles(fullPath));
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }

      return files;
    };

    const tsFiles = findTsFiles(srcPath);
    let filesWithImports = 0;

    for (const filePath of tsFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for imports from obsidian-plugin-config
        const importRegex = /import\s+.*from\s+["']obsidian-plugin-config[^"']*["']/g;
        if (importRegex.test(content)) {
          filesWithImports++;
          console.log(`   ⚠️  ${path.relative(targetPath, filePath)} - contains centralized imports`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not analyze ${path.relative(targetPath, filePath)}: ${error}`);
      }
    }

    if (filesWithImports === 0) {
      console.log(`   ✅ No centralized imports found`);
    } else {
      console.log(`   ⚠️  Found ${filesWithImports} files with centralized imports`);
      console.log(`   💡 You may need to manually comment these imports for the plugin to work`);
    }

  } catch (error) {
    console.error(`   ❌ Failed to analyze imports: ${error}`);
  }
}

/**
 * Create required directories
 */
async function createRequiredDirectories(targetPath: string): Promise<void> {
  const directories = [
    path.join(targetPath, ".github", "workflows")
  ];

  for (const dir of directories) {
    if (!await isValidPath(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   📁 Created ${path.relative(targetPath, dir)}`);
    }
  }
}

/**
 * Run yarn install in target directory
 */
async function runYarnInstall(targetPath: string): Promise<void> {
  console.log(`\n📦 Installing dependencies...`);

  try {
    execSync('yarn install', {
      cwd: targetPath,
      stdio: 'inherit'
    });
    console.log(`   ✅ Dependencies installed successfully`);
  } catch (error) {
    console.error(`   ❌ Failed to install dependencies: ${error}`);
    console.log(`   💡 You may need to run 'yarn install' manually in the target directory`);
  }
}

/**
 * Main injection function
 */
export async function performInjection(targetPath: string): Promise<void> {
  console.log(`\n🚀 Starting injection process...`);

  try {
    // Step 1: Inject scripts
    await injectScripts(targetPath);

    // Step 2: Update package.json
    console.log(`\n📦 Updating package.json...`);
    await updatePackageJson(targetPath);

    // Step 3: Analyze centralized imports (without modifying)
    await analyzeCentralizedImports(targetPath);

    // Step 4: Create required directories
    console.log(`\n📁 Creating required directories...`);
    await createRequiredDirectories(targetPath);

    // Step 5: Install dependencies
    await runYarnInstall(targetPath);

    // FINAL DEBUG: Check package.json one last time
    const finalPackageJsonPath = path.join(targetPath, "package.json");
    const finalContent = fs.readFileSync(finalPackageJsonPath, 'utf8');
    const finalJson = JSON.parse(finalContent);
    console.log(`\n🔍 FINAL CHECK - Package name at end: ${finalJson.name}`);

    console.log(`\n✅ Injection completed successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. cd ${targetPath}`);
    console.log(`   2. yarn build    # Test the build`);
    console.log(`   3. yarn start    # Test development mode`);
    console.log(`   4. yarn acp      # Commit changes (or yarn bacp for build+commit)`);

  } catch (error) {
    console.error(`\n❌ Injection failed: ${error}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(`🎯 Obsidian Plugin Config - Local Injection Tool`);
    console.log(`📥 Inject autonomous configuration from local files\n`);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const autoConfirm = args.includes('--yes') || args.includes('-y');
    const dryRun = args.includes('--dry-run') || args.includes('--check');
    const targetPath = args.find(arg => !arg.startsWith('-'));

    if (!targetPath) {
      console.error(`❌ Usage: yarn inject-path <plugin-directory> [options]`);
      console.error(`   Example: yarn inject-path ../my-obsidian-plugin`);
      console.error(`   Options:`);
      console.error(`     --yes, -y       Auto-confirm injection`);
      console.error(`     --dry-run       Check only (no injection)`);
      console.error(`   Shortcuts:`);
      console.error(`     yarn check-plugin ../plugin    # Verification only`);
      console.error(`     yarn verify-plugin ../plugin   # Alias pour check-plugin`);
      process.exit(1);
    }

    // Resolve and validate path
    const resolvedPath = path.resolve(targetPath);

    if (!await isValidPath(resolvedPath)) {
      console.error(`❌ Directory not found: ${resolvedPath}`);
      process.exit(1);
    }

    console.log(`📁 Target directory: ${resolvedPath}`);

    // Analyze the plugin
    console.log(`\n🔍 Analyzing plugin...`);
    const plan = await analyzePlugin(resolvedPath);

    // Show plan and ask for confirmation (or just show plan in dry-run mode)
    if (dryRun) {
      console.log(`\n🎯 Injection Plan for: ${plan.targetPath}`);
      console.log(`📁 Target: ${path.basename(plan.targetPath)}`);
      console.log(`📦 Package.json: ${plan.hasPackageJson ? '✅' : '❌'}`);
      console.log(`📋 Manifest.json: ${plan.hasManifest ? '✅' : '❌'}`);
      console.log(`📂 Scripts folder: ${plan.hasScriptsFolder ? '✅ (will be updated)' : '❌ (will be created)'}`);
      console.log(`🔌 Obsidian plugin: ${plan.isObsidianPlugin ? '✅' : '❌'}`);

      if (!plan.isObsidianPlugin) {
        console.log(`\n⚠️  Warning: This doesn't appear to be a valid Obsidian plugin`);
        console.log(`   Missing manifest.json or invalid structure`);
      }

      console.log(`\n📋 Would inject:`);
      console.log(`   ✅ Local scripts (utils.ts, esbuild.config.ts, acp.ts, etc.)`);
      console.log(`   ✅ Updated package.json scripts`);
      console.log(`   ✅ Required dependencies`);
      console.log(`   🔍 Analyze centralized imports (manual commenting may be needed)`);

      // Check for existing injection
      const scriptsPath = path.join(resolvedPath, "scripts");
      const hasInjectedScripts = fs.existsSync(path.join(scriptsPath, "utils.ts"));

      if (hasInjectedScripts) {
        console.log(`\n✅ Status: Plugin appears to be already injected`);
        console.log(`   Found: scripts/utils.ts (injection marker)`);
      } else {
        console.log(`\n❌ Status: Plugin not yet injected`);
        console.log(`   Missing: scripts/utils.ts`);
      }

      console.log(`\n🔍 Dry-run completed - no changes made`);
      console.log(`   To inject: yarn inject ${targetPath} --yes`);
      return;
    }

    const confirmed = await showInjectionPlan(plan, autoConfirm);

    if (!confirmed) {
      console.log(`❌ Injection cancelled by user`);
      process.exit(0);
    }

    // Perform injection
    await performInjection(resolvedPath);

  } catch (error) {
    console.error(`💥 Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error);
