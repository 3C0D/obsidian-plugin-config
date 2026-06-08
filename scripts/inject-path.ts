#!/usr/bin/env tsx

import { readFile } from 'fs/promises';
import path from 'path';
import {
  analyzePlugin,
  ensurePluginConfigClean,
  findPluginConfigRoot,
  performInjection,
  readInjectionInfo,
  showInjectionPlan
} from './inject-core.js';
import { isValidPath } from './utils.js';

async function main(): Promise<void> {
  try {
    // Show version
    const configRoot = await findPluginConfigRoot();
    let version = 'unknown';
    try {
      const pkg = JSON.parse(await readFile(path.join(configRoot, 'package.json'), 'utf8'));
      version = pkg.version || 'unknown';
    } catch {
      // Ignore
    }

    console.log(`🎯 Obsidian Plugin Config - Local Injection Tool v${version}`);
    console.log(`📥 Inject autonomous configuration from local files\n`);

    const args = process.argv.slice(2);
    const autoConfirm = args.includes('--yes') || args.includes('-y');
    const dryRun = args.includes('--dry-run') || args.includes('--check');
    const targetPath = args.find((arg) => !arg.startsWith('-'));

    if (!targetPath) {
      console.error(`❌ Usage: yarn inject-path <plugin-directory> [options]`);
      console.error(`   Example: yarn inject-path ../my-obsidian-plugin`);
      console.error(`   Options:`);
      console.error(`     --yes, -y           Auto-confirm injection`);
      console.error(`     --dry-run           Check only (no injection)`);
      console.error(`   Shortcuts:`);
      console.error(`     yarn check-plugin ../plugin    # Verification only`);
      process.exit(1);
    }

    const resolvedPath = path.resolve(targetPath);

    if (!(await isValidPath(resolvedPath))) {
      console.error(`❌ Directory not found: ${resolvedPath}`);
      process.exit(1);
    }

    // Prevent injecting into obsidian-plugin-config itself
    const selfPkg = path.join(resolvedPath, 'package.json');
    try {
      const pkg = JSON.parse(await readFile(selfPkg, 'utf8'));
      if (pkg.name === 'obsidian-plugin-config') {
        console.error(`❌ Cannot inject into obsidian-plugin-config itself.`);
        process.exit(1);
      }
    } catch {
      // No package.json or unreadable - not the self case
    }

    console.log(`📁 Target directory: ${resolvedPath}`);
    console.log(`\n🔍 Analyzing plugin...`);
    const plan = await analyzePlugin(resolvedPath);

    if (dryRun) {
      console.log(`\n🎯 Injection Plan for: ${plan.targetPath}`);
      console.log(`📁 Target: ${path.basename(plan.targetPath)}`);
      console.log(`📦 Package.json: ${plan.hasPackageJson ? '✅' : '❌'}`);
      console.log(`📋 Manifest.json: ${plan.hasManifest ? '✅' : '❌'}`);
      console.log(
        `📂 Scripts folder: ${plan.hasScriptsFolder ? '✅ (will be updated)' : '❌ (will be created)'}`
      );
      console.log(`🔌 Obsidian plugin: ${plan.isObsidianPlugin ? '✅' : '❌'}`);

      if (!plan.isObsidianPlugin) {
        console.log(`\n⚠️  Warning: This doesn't appear to be a valid Obsidian plugin`);
        console.log(`   Missing manifest.json or invalid structure`);
      }

      console.log(`\n📋 Would inject:`);
      console.log(`   ✅ Local scripts (utils.ts, esbuild.config.ts, acp.ts, etc.)`);
      console.log(`   ✅ Updated package.json scripts`);
      console.log(`   ✅ Required dependencies`);

      const injectionInfo = await readInjectionInfo(resolvedPath);

      if (injectionInfo) {
        console.log(`\n✅ Status: Plugin is already injected`);
        console.log(`   📦 Injector: ${injectionInfo.injectorName || 'unknown'}`);
        console.log(`   🏷️  Version: ${injectionInfo.injectorVersion || 'unknown'}`);
        console.log(
          `   📅 Date: ${
            injectionInfo.injectionDate
              ? new Date(injectionInfo.injectionDate).toLocaleDateString()
              : 'unknown'
          }`
        );

        try {
          const configPackageJson = JSON.parse(
            await readFile(path.join(configRoot, 'package.json'), 'utf8')
          );
          const currentVersion = configPackageJson.version;
          if (
            currentVersion &&
            injectionInfo.injectorVersion &&
            currentVersion !== injectionInfo.injectorVersion
          ) {
            console.log(
              `   🔄 Update available: ${injectionInfo.injectorVersion} → ${currentVersion}`
            );
          }
        } catch {
          // Ignore version comparison errors
        }
      } else {
        const hasInjectedScripts = await isValidPath(
          path.join(resolvedPath, 'scripts', 'utils.ts')
        );
        if (hasInjectedScripts) {
          console.log(`\n⚠️  Status: Plugin appears to be injected (legacy)`);
          console.log(`   Found: scripts/utils.ts but no .injection-info.json`);
          console.log(`   💡 Re-inject to add version tracking`);
        } else {
          console.log(`\n❌ Status: Plugin not yet injected`);
        }
      }

      console.log(`\n🔍 Dry-run completed - no changes made`);
      console.log(`   To inject: yarn inject ${targetPath} --yes`);
      return;
    }

    console.log(`\n🔍 Checking plugin-config repository status...`);
    await ensurePluginConfigClean();

    const confirmed = await showInjectionPlan(plan, autoConfirm);

    if (!confirmed) {
      console.log(`❌ Injection cancelled by user`);
      process.exit(0);
    }

    await performInjection(resolvedPath, autoConfirm);
  } catch (error) {
    console.error(`💥 Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch(console.error);
