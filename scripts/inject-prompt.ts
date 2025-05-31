#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  askQuestion,
  askConfirmation,
  createReadlineInterface,
  isValidPath
} from "./utils.js";

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
async function showInjectionPlan(plan: InjectionPlan): Promise<boolean> {
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

  return await askConfirmation(`\nProceed with injection?`, rl);
}

/**
 * Find plugin-config root directory
 */
function findPluginConfigRoot(): string {
  // Auto-detect parent, fallback to current
  const parentPath = path.resolve(process.cwd(), "../obsidian-plugin-config");
  if (fs.existsSync(parentPath)) {
    return parentPath;
  }

  // Fallback to current directory
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
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

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

    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log(`   ✅ Updated package.json (${addedDeps} new, ${updatedDeps} updated dependencies)`);

  } catch (error) {
    console.error(`   ❌ Failed to update package.json: ${error}`);
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
 * Direct injection function (without argument parsing)
 */
async function performInjectionDirect(targetPath: string): Promise<void> {
  console.log(`\n🚀 Starting injection process...`);

  try {
    // Step 1: Inject scripts
    await injectScripts(targetPath);

    // Step 2: Update package.json
    console.log(`\n📦 Updating package.json...`);
    await updatePackageJson(targetPath);

    // Step 3: Install dependencies
    await runYarnInstall(targetPath);

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
 * Ask user for target directory path
 */
async function promptForTargetPath(): Promise<string> {
  console.log(`\n📁 Select target plugin directory:`);
  console.log(`   Common paths (copy-paste ready):`);
  console.log(`   - ../test-sample-plugin`);
  console.log(`   - ../sample-plugin-modif`);
  console.log(`   - ../my-obsidian-plugin`);
  console.log(`   💡 Tip: You can paste paths with or without quotes`);

  while (true) {
    const rawInput = await askQuestion(`\nEnter plugin directory path: `, rl);

    if (!rawInput.trim()) {
      console.log(`❌ Please enter a valid path`);
      continue;
    }

    // Remove quotes if present and trim
    const cleanPath = rawInput.trim().replace(/^["']|["']$/g, '');
    const resolvedPath = path.resolve(cleanPath);

    if (!await isValidPath(resolvedPath)) {
      console.log(`❌ Directory not found: ${resolvedPath}`);
      const retry = await askConfirmation(`Try again?`, rl);
      if (!retry) {
        throw new Error("User cancelled");
      }
      continue;
    }

    console.log(`📁 Target directory: ${resolvedPath}`);
    return resolvedPath;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(`🎯 Obsidian Plugin Config - Interactive Injection Tool`);
    console.log(`📥 Inject autonomous configuration with prompts\n`);

    // Check if path provided as argument
    const args = process.argv.slice(2);
    let targetPath: string;

    if (args.length > 0) {
      // Use provided argument
      const rawPath = args[0];
      const cleanPath = rawPath.trim().replace(/^["']|["']$/g, '');
      targetPath = path.resolve(cleanPath);

      if (!await isValidPath(targetPath)) {
        console.error(`❌ Directory not found: ${targetPath}`);
        process.exit(1);
      }

      console.log(`📁 Using provided path: ${targetPath}`);
    } else {
      // Prompt for target directory
      targetPath = await promptForTargetPath();
    }

    // Analyze the plugin
    console.log(`\n🔍 Analyzing plugin...`);
    const plan = await analyzePlugin(targetPath);

    // Show plan and ask for confirmation
    const confirmed = await showInjectionPlan(plan);

    if (!confirmed) {
      console.log(`❌ Injection cancelled by user`);
      process.exit(0);
    }

    // Perform injection directly
    await performInjectionDirect(targetPath);

  } catch (error) {
    console.error(`💥 Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error);
