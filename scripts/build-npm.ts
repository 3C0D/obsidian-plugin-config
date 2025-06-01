#!/usr/bin/env tsx

import fs from "fs";
import { execSync } from "child_process";
import {
  askConfirmation,
  createReadlineInterface
} from "./utils.js";

const rl = createReadlineInterface();

/**
 * Build NPM package from local development
 */
async function buildNpmPackage(): Promise<void> {
  console.log(`🏗️  Building NPM package from local development...`);

  try {
    // Step 1: Verify all scripts are ready
    console.log(`\n📋 Verifying scripts...`);

    const requiredScripts = [
      "scripts/inject-path.ts",
      "scripts/inject-prompt.ts",
      "scripts/utils.ts",
      "scripts/esbuild.config.ts",
      "scripts/acp.ts",
      "scripts/update-version.ts",
      "scripts/release.ts",
      "scripts/help.ts"
    ];

    for (const script of requiredScripts) {
      if (!fs.existsSync(script)) {
        throw new Error(`Missing required script: ${script}`);
      }
      console.log(`   ✅ ${script}`);
    }

    // Step 2: Update bin/obsidian-inject.js if needed
    console.log(`\n📦 Checking bin/obsidian-inject.js...`);
    const binPath = "bin/obsidian-inject.js";

    if (fs.existsSync(binPath)) {
      console.log(`   ✅ ${binPath} exists`);
    } else {
      throw new Error(`Missing bin file: ${binPath}`);
    }

    // Step 3: Verify package.json is ready for NPM
    console.log(`\n📄 Verifying package.json for NPM...`);
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    const requiredFields = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      bin: packageJson.bin,
      repository: packageJson.repository,
      author: packageJson.author
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new Error(`Missing required package.json field: ${field}`);
      }
      console.log(`   ✅ ${field}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    }

    // Step 4: Check if we're logged into NPM
    console.log(`\n🔐 Checking NPM authentication...`);
    try {
      const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
      console.log(`   ✅ Logged in as: ${whoami}`);
    } catch {
      console.log(`   ❌ Not logged into NPM`);
      console.log(`   💡 Run: npm login`);
      throw new Error("NPM authentication required");
    }

    // Step 5: Run tests to ensure everything works
    console.log(`\n🧪 Running quick test...`);
    try {
      execSync('yarn build', { stdio: 'inherit' });
      console.log(`   ✅ Build test passed`);
    } catch {
      throw new Error("Build test failed");
    }

    console.log(`\n✅ Package is ready for NPM publication!`);

    // Step 6: Ask for confirmation
    const shouldPublish = await askConfirmation(`\nProceed with NPM publication?`, rl);

    if (!shouldPublish) {
      console.log(`❌ Publication cancelled`);
      return;
    }

    // Step 7: Publish to NPM
    console.log(`\n📤 Publishing to NPM...`);
    execSync('npm publish', { stdio: 'inherit' });

    console.log(`\n🎉 Package published successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. npm install -g ${packageJson.name}`);
    console.log(`   2. cd any-obsidian-plugin && obsidian-inject`);
    console.log(`   3. Test the global installation`);

  } catch (error) {
    console.error(`\n❌ Build failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(`🎯 Obsidian Plugin Config - NPM Package Builder`);
    console.log(`📦 Prepare and publish NPM package\n`);

    await buildNpmPackage();

  } catch (error) {
    console.error(`💥 Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error);
