#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { isValidPath, gitExec } from "./utils.js";

export interface InjectionPlan {
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
export async function analyzePlugin(pluginPath: string): Promise<InjectionPlan> {
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

  if (plan.hasManifest) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      plan.isObsidianPlugin = !!(manifest.id && manifest.name && manifest.version);
    } catch {
      console.warn("Warning: Could not parse manifest.json");
    }
  }

  if (plan.hasPackageJson) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      plan.currentDependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ];
    } catch {
      console.warn("Warning: Could not parse package.json");
    }
  }

  return plan;
}

/**
 * Find plugin-config root directory (handles NPM global installs)
 */
export function findPluginConfigRoot(): string {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const npmPackageRoot = path.resolve(scriptDir, "..");
  const npmPackageJson = path.join(npmPackageRoot, "package.json");

  if (fs.existsSync(npmPackageJson)) {
    try {
      const packageContent = JSON.parse(fs.readFileSync(npmPackageJson, "utf8"));
      if (packageContent.name === "obsidian-plugin-config") {
        return npmPackageRoot;
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return process.cwd();
}

/**
 * Copy file content from local plugin-config directory
 */
export function copyFromLocal(filePath: string): string {
  const configRoot = findPluginConfigRoot();
  const sourcePath = path.join(configRoot, filePath);

  try {
    return fs.readFileSync(sourcePath, "utf8");
  } catch (error) {
    throw new Error(`Failed to copy ${filePath}: ${error}`);
  }
}

/**
 * Check if plugin-config repo is clean and commit if needed
 */
export async function ensurePluginConfigClean(): Promise<void> {
  const configRoot = findPluginConfigRoot();
  const gitDir = path.join(configRoot, ".git");

  // Skip git check if not a git repo
  // (e.g. NPM global install)
  if (!fs.existsSync(gitDir)) {
    console.log(
      `✅ Plugin-config repo is clean` +
      ` (NPM install, no git check)`
    );
    return;
  }

  const originalCwd = process.cwd();

  try {
    process.chdir(configRoot);
    const gitStatus = execSync(
      "git status --porcelain",
      { encoding: "utf8" }
    ).trim();

    if (gitStatus) {
      console.log(
        `\n⚠️  Plugin-config has uncommitted changes:`
      );
      console.log(gitStatus);
      console.log(
        `\n🔧 Auto-committing changes...`
      );

      const msg =
        "🔧 Update plugin-config templates";
      gitExec("git add -A");
      gitExec(`git commit -m "${msg}"`);

      try {
        const branch = execSync(
          "git rev-parse --abbrev-ref HEAD",
          { encoding: "utf8" }
        ).trim();
        gitExec(`git push origin ${branch}`);
        console.log(
          `✅ Changes committed and pushed`
        );
      } catch {
        try {
          const branch = execSync(
            "git rev-parse --abbrev-ref HEAD",
            { encoding: "utf8" }
          ).trim();
          gitExec(
            `git push --set-upstream origin ${branch}`
          );
          console.log(
            `✅ New branch pushed with upstream`
          );
        } catch {
          console.log(
            `⚠️  Committed locally, push failed`
          );
        }
      }
    } else {
      console.log(`✅ Plugin-config repo is clean`);
    }
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Display injection plan and ask for confirmation
 */
export async function showInjectionPlan(
  plan: InjectionPlan,
  autoConfirm: boolean = false,
  useSass: boolean = false
): Promise<boolean> {
  const { askConfirmation, createReadlineInterface } = await import("./utils.js");
  const rl = createReadlineInterface();

  console.log(`\n🎯 Injection Plan for: ${plan.targetPath}`);
  console.log(`📁 Target: ${path.basename(plan.targetPath)}`);
  console.log(`📦 Package.json: ${plan.hasPackageJson ? "✅" : "❌"}`);
  console.log(`📋 Manifest.json: ${plan.hasManifest ? "✅" : "❌"}`);
  console.log(
    `📂 Scripts folder: ${plan.hasScriptsFolder ? "✅ (will be updated)" : "❌ (will be created)"}`
  );
  console.log(`🔌 Obsidian plugin: ${plan.isObsidianPlugin ? "✅" : "❌"}`);
  console.log(
    `🎨 SASS support: ${useSass ? "✅ (esbuild-sass-plugin will be added)" : "❌"}`
  );

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
    rl.close();
    return true;
  }

  const result = await askConfirmation(`\nProceed with injection?`, rl);
  rl.close();
  return result;
}

/**
 * Clean old script files
 */
export async function cleanOldScripts(scriptsPath: string): Promise<void> {
  const scriptNames = ["utils", "esbuild.config", "acp", "update-version", "release", "help"];
  const extensions = [".ts", ".mts", ".js", ".mjs"];

  for (const scriptName of scriptNames) {
    for (const ext of extensions) {
      const scriptFile = path.join(scriptsPath, `${scriptName}${ext}`);
      if (await isValidPath(scriptFile)) {
        fs.unlinkSync(scriptFile);
        console.log(`🗑️  Removed existing ${scriptName}${ext} (will be replaced)`);
      }
    }
  }

  const obsoleteFiles = ["start.mjs", "start.js"];
  for (const fileName of obsoleteFiles) {
    const filePath = path.join(scriptsPath, fileName);
    if (await isValidPath(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed obsolete file: ${fileName}`);
    }
  }
}

/**
 * Clean old ESLint config files
 */
export async function cleanOldLintFiles(targetPath: string): Promise<void> {
  const oldLintFiles = [".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintignore"];
  const conflictingLintFiles = [
    "eslint.config.ts",
    "eslint.config.cjs",
    "eslint.config.js",
    "eslint.config.mjs"
  ];

  for (const fileName of oldLintFiles) {
    const filePath = path.join(targetPath, fileName);
    if (await isValidPath(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed old ESLint file: ${fileName} (replaced by eslint.config.ts)`);
    }
  }

  for (const fileName of conflictingLintFiles) {
    const filePath = path.join(targetPath, fileName);
    if (await isValidPath(filePath)) {
      fs.unlinkSync(filePath);
      console.log(
        `🗑️  Removed existing ESLint file: ${fileName} (will be replaced by injection)`
      );
    }
  }
}

/**
 * Inject scripts and config files
 */
export async function injectScripts(targetPath: string, useSass: boolean = false): Promise<void> {
  const scriptsPath = path.join(targetPath, "scripts");

  if (!await isValidPath(scriptsPath)) {
    fs.mkdirSync(scriptsPath, { recursive: true });
    console.log(`📁 Created scripts directory`);
  }

  await cleanOldScripts(scriptsPath);
  await cleanOldLintFiles(targetPath);

  const scriptFiles = [
    "templates/scripts/utils.ts",
    "templates/scripts/esbuild.config.ts",
    "templates/scripts/acp.ts",
    "templates/scripts/update-version.ts",
    "templates/scripts/release.ts",
    "templates/scripts/help.ts"
  ];

  // Files that should NOT be overwritten if they
  // already exist (contain user-specific config)
  const skipIfExists = new Set([".env"]);

  // Files with .template suffix (NPM excludes dotfiles)
  // Map: { source: targetName }
  const configFileMap: Record<string, string> = {
    "templates/tsconfig.json": "tsconfig.json",
    "templates/gitignore.template": ".gitignore",
    "templates/eslint.config.mts": "eslint.config.mts",
    "templates/.editorconfig": ".editorconfig",
    "templates/.prettierrc": ".prettierrc",
    "templates/npmrc.template": ".npmrc",
    "templates/env.template": ".env",
  };

  const configVscodeMap: Record<string, string> = {
    "templates/.vscode/settings.json":
      ".vscode/settings.json",
    "templates/.vscode/tasks.json":
      ".vscode/tasks.json",
  };

  const workflowFiles = [
    "templates/.github/workflows/release.yml",
    "templates/.github/workflows/release-body.md"
  ];

  console.log(`\n📥 Copying scripts from local files...`);

  for (const scriptFile of scriptFiles) {
    try {
      const content = copyFromLocal(scriptFile);
      const fileName = path.basename(scriptFile);
      const targetFile = path.join(scriptsPath, fileName);
      fs.writeFileSync(targetFile, content, "utf8");
      console.log(`   ✅ ${fileName}`);
    } catch (error) {
      console.error(`   ❌ Failed to inject ${scriptFile}: ${error}`);
    }
  }

  console.log(`\n📥 Copying config files...`);

  // Copy root config files
  for (const [src, destName] of Object.entries(
    configFileMap
  )) {
    try {
      const targetFile = path.join(
        targetPath, destName
      );
      // Skip if file exists and is user-specific
      if (
        skipIfExists.has(destName) &&
        fs.existsSync(targetFile)
      ) {
        console.log(
          `   ⏭️  ${destName} (kept existing)`
        );
        continue;
      }
      const content = copyFromLocal(src);
      fs.writeFileSync(targetFile, content, "utf8");
      console.log(`   ✅ ${destName}`);
    } catch (error) {
      console.error(
        `   ❌ Failed to inject ${destName}: ${error}`
      );
    }
  }

  // Copy .vscode config files
  for (const [src, destName] of Object.entries(
    configVscodeMap
  )) {
    try {
      const content = copyFromLocal(src);
      const targetFile = path.join(
        targetPath, destName
      );
      const targetDir = path.dirname(targetFile);
      if (!await isValidPath(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(targetFile, content, "utf8");
      console.log(`   ✅ ${destName}`);
    } catch (error) {
      console.error(
        `   ❌ Failed to inject ${destName}: ${error}`
      );
    }
  }

  console.log(`\n📥 Copying GitHub workflows from local files...`);

  for (const workflowFile of workflowFiles) {
    try {
      const content = copyFromLocal(workflowFile);
      const relativePath = workflowFile.replace("templates/", "");
      const targetFile = path.join(targetPath, relativePath);
      const targetDir = path.dirname(targetFile);

      if (!await isValidPath(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetFile, content, "utf8");
      console.log(`   ✅ ${relativePath}`);
    } catch (error) {
      console.error(`   ❌ Failed to inject ${workflowFile}: ${error}`);
    }
  }
}

/**
 * Update package.json with autonomous configuration
 */
export async function updatePackageJson(
  targetPath: string,
  useSass: boolean = false
): Promise<void> {
  const packageJsonPath = path.join(targetPath, "package.json");

  if (!await isValidPath(packageJsonPath)) {
    console.log(`❌ No package.json found, skipping package.json update`);
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    const obsoleteScripts = ["version"];
    for (const script of obsoleteScripts) {
      if (packageJson.scripts?.[script]) {
        console.log(`   🧹 Removing obsolete script: "${script}"`);
        delete packageJson.scripts[script];
      }
    }

    packageJson.scripts = {
      ...packageJson.scripts,
      start: "yarn install && yarn dev",
      dev: "tsx scripts/esbuild.config.ts",
      build: "tsc -noEmit -skipLibCheck && tsx scripts/esbuild.config.ts production",
      real: "tsx scripts/esbuild.config.ts production real",
      acp: "tsx scripts/acp.ts",
      bacp: "tsx scripts/acp.ts -b",
      "update-version": "tsx scripts/update-version.ts",
      v: "tsx scripts/update-version.ts",
      release: "tsx scripts/release.ts",
      r: "tsx scripts/release.ts",
      help: "tsx scripts/help.ts",
      h: "tsx scripts/help.ts",
      lint: "eslint . --ext .ts",
      "lint:fix": "eslint . --ext .ts --fix"
    };

    if (packageJson.dependencies?.["obsidian-plugin-config"]) {
      delete packageJson.dependencies["obsidian-plugin-config"];
      console.log(`   🗑️  Removed obsidian-plugin-config dependency`);
    }

    if (!packageJson.devDependencies) packageJson.devDependencies = {};

    const requiredDeps: Record<string, string> = {
      "@types/eslint": "latest",
      "@types/node": "^22.15.26",
      "@types/semver": "^7.7.0",
      "@typescript-eslint/eslint-plugin": "latest",
      "@typescript-eslint/parser": "latest",
      "builtin-modules": "3.3.0",
      dedent: "^1.6.0",
      dotenv: "^16.4.5",
      esbuild: "latest",
      eslint: "latest",
      "eslint-import-resolver-typescript": "latest",
      jiti: "latest",
      obsidian: "*",
      "obsidian-typings": "^3.9.5",
      prettier: "^3.4.0",
      semver: "^7.7.2",
      tsx: "^4.19.4",
      typescript: "^5.8.2",
      ...(useSass ? { "esbuild-sass-plugin": "^3.3.1" } : {})
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

    if (!packageJson.engines) packageJson.engines = {};
    packageJson.engines.npm = "please-use-yarn";
    packageJson.engines.yarn = ">=1.22.0";
    packageJson.type = "module";

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf8");
    console.log(`   ✅ Updated package.json (${addedDeps} new, ${updatedDeps} updated dependencies)`);
  } catch (error) {
    console.error(`   ❌ Failed to update package.json: ${error}`);
  }
}

/**
 * Analyze centralized imports in source files (without modifying)
 */
export async function analyzeCentralizedImports(targetPath: string): Promise<void> {
  const srcPath = path.join(targetPath, "src");

  if (!await isValidPath(srcPath)) {
    console.log(`   ℹ️  No src directory found`);
    return;
  }

  console.log(`\n🔍 Analyzing centralized imports...`);

  try {
    const findTsFiles = (dir: string): string[] => {
      const files: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...findTsFiles(fullPath));
        } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const tsFiles = findTsFiles(srcPath);
    let filesWithImports = 0;

    for (const filePath of tsFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
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
export async function createRequiredDirectories(targetPath: string): Promise<void> {
  const directories = [path.join(targetPath, ".github", "workflows")];

  for (const dir of directories) {
    if (!await isValidPath(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   📁 Created ${path.relative(targetPath, dir)}`);
    }
  }
}

/**
 * Create injection info file
 */
export async function createInjectionInfo(targetPath: string): Promise<void> {
  const configRoot = findPluginConfigRoot();
  const configPackageJsonPath = path.join(configRoot, "package.json");

  let injectorVersion = "unknown";
  try {
    const configPackageJson = JSON.parse(fs.readFileSync(configPackageJsonPath, "utf8"));
    injectorVersion = configPackageJson.version || "unknown";
  } catch {
    console.warn("Warning: Could not read injector version");
  }

  const injectionInfo = {
    injectorVersion,
    injectionDate: new Date().toISOString(),
    injectorName: "obsidian-plugin-config"
  };

  const infoPath = path.join(targetPath, ".injection-info.json");
  fs.writeFileSync(infoPath, JSON.stringify(injectionInfo, null, 2));
  console.log(`   ✅ Created injection info file (.injection-info.json)`);
}

/**
 * Read injection info from target plugin
 */
export function readInjectionInfo(targetPath: string): Record<string, string> | null {
  const infoPath = path.join(targetPath, ".injection-info.json");

  if (!fs.existsSync(infoPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(infoPath, "utf8"));
  } catch {
    console.warn("Warning: Could not parse .injection-info.json");
    return null;
  }
}

/**
 * Clean NPM artifacts if package-lock.json is found
 */
export async function cleanNpmArtifactsIfNeeded(targetPath: string): Promise<void> {
  const packageLockPath = path.join(targetPath, "package-lock.json");

  if (fs.existsSync(packageLockPath)) {
    console.log(`\n🧹 NPM installation detected, cleaning artifacts...`);

    try {
      fs.unlinkSync(packageLockPath);
      console.log(`   🗑️  Removed package-lock.json`);

      const nodeModulesPath = path.join(targetPath, "node_modules");
      if (fs.existsSync(nodeModulesPath)) {
        fs.rmSync(nodeModulesPath, { recursive: true, force: true });
        console.log(`   🗑️  Removed node_modules (will be reinstalled with Yarn)`);
      }

      console.log(`   ✅ NPM artifacts cleaned to avoid Yarn conflicts`);
    } catch (error) {
      console.error(`   ❌ Failed to clean NPM artifacts: ${error}`);
      console.log(`   💡 You may need to manually remove package-lock.json and node_modules`);
    }
  }
}

/**
 * Check if tsx is installed locally and install it if needed
 */
export async function ensureTsxInstalled(targetPath: string): Promise<void> {
  console.log(`\n🔍 Checking tsx installation...`);

  const packageJsonPath = path.join(targetPath, "package.json");

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const devDependencies = packageJson.devDependencies || {};
    const dependencies = packageJson.dependencies || {};

    if (devDependencies.tsx || dependencies.tsx) {
      console.log(`   ✅ tsx is already installed`);
      return;
    }

    console.log(`   ⚠️  tsx not found, installing as dev dependency...`);
    execSync("yarn add -D tsx", { cwd: targetPath, stdio: "inherit" });
    console.log(`   ✅ tsx installed successfully`);
  } catch (error) {
    console.error(`   ❌ Failed to install tsx: ${error}`);
    console.log(`   💡 You may need to install tsx manually: yarn add -D tsx`);
    throw new Error("tsx installation failed");
  }
}

/**
 * Run yarn install in target directory
 */
export async function runYarnInstall(targetPath: string): Promise<void> {
  console.log(`\n📦 Installing dependencies...`);

  try {
    execSync("yarn install", { cwd: targetPath, stdio: "inherit" });
    console.log(`   ✅ Dependencies installed successfully`);
  } catch (error) {
    console.error(`   ❌ Failed to install dependencies: ${error}`);
    console.log(`   💡 You may need to run 'yarn install' manually in the target directory`);
  }
}

/**
 * Main injection orchestration function
 */
export async function performInjection(
  targetPath: string,
  useSass: boolean = false
): Promise<void> {
  console.log(`\n🚀 Starting injection process...`);

  try {
    await cleanNpmArtifactsIfNeeded(targetPath);
    await ensureTsxInstalled(targetPath);
    await injectScripts(targetPath, useSass);

    console.log(`\n📦 Updating package.json...`);
    await updatePackageJson(targetPath, useSass);

    await analyzeCentralizedImports(targetPath);

    console.log(`\n📁 Creating required directories...`);
    await createRequiredDirectories(targetPath);

    await runYarnInstall(targetPath);

    console.log(`\n📝 Creating injection info...`);
    await createInjectionInfo(targetPath);

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
