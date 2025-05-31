#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  askQuestion,
  askConfirmation,
  createReadlineInterface,
  isValidPath
} from "./utils.ts";

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
 * Download file content from GitHub raw URL
 */
async function downloadFromGitHub(filePath: string): Promise<string> {
  const baseUrl = "https://raw.githubusercontent.com/3C0D/obsidian-plugin-config/master";
  const url = `${baseUrl}/${filePath}`;

  try {
    // Use curl or wget depending on platform
    let command: string;
    if (process.platform === 'win32') {
      command = `curl -s "${url}"`;
    } else {
      command = `curl -s "${url}" || wget -qO- "${url}"`;
    }

    const content = execSync(command, { encoding: 'utf8' });
    return content;
  } catch (error) {
    throw new Error(`Failed to download ${filePath}: ${error}`);
  }
}

/**
 * Inject scripts from GitHub
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

  console.log(`\n📥 Downloading scripts from GitHub...`);

  for (const scriptFile of scriptFiles) {
    try {
      const content = await downloadFromGitHub(scriptFile);
      const fileName = path.basename(scriptFile);
      const targetFile = path.join(scriptsPath, fileName);

      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`   ✅ ${fileName}`);
    } catch (error) {
      console.error(`   ❌ Failed to inject ${scriptFile}: ${error}`);
    }
  }

  console.log(`\n📥 Downloading config files from GitHub...`);

  for (const configFile of configFiles) {
    try {
      const content = await downloadFromGitHub(configFile);
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

    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log(`   ✅ Updated package.json (${addedDeps} new, ${updatedDeps} updated dependencies)`);

    // Debug: verify package.json was written correctly
    console.log(`   🔍 Package name: ${packageJson.name}`);

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
async function performInjection(targetPath: string): Promise<void> {
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
    console.log(`🎯 Obsidian Plugin Config - GitHub Injection Tool`);
    console.log(`📥 Inject autonomous configuration from GitHub\n`);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const autoConfirm = args.includes('--yes') || args.includes('-y');
    const targetPath = args.find(arg => !arg.startsWith('-'));

    if (!targetPath) {
      console.error(`❌ Usage: yarn inject-path <plugin-directory> [--yes]`);
      console.error(`   Example: yarn inject-path ../my-obsidian-plugin`);
      console.error(`   Options: --yes, -y  Auto-confirm injection`);
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

    // Show plan and ask for confirmation
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
