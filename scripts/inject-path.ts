#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import {
	analyzePlugin,
	ensurePluginConfigClean,
	findPluginConfigRoot,
	performInjection,
	readInjectionInfo,
	showInjectionPlan
} from './inject-core.js';
import { createReadlineInterface, isValidPath } from './utils.js';

const rl = createReadlineInterface();

async function main(): Promise<void> {
	try {
		// Show version
		const configRoot = findPluginConfigRoot();
		let version = 'unknown';
		try {
			const pkg = JSON.parse(
				fs.readFileSync(path.join(configRoot, 'package.json'), 'utf8')
			);
			version = pkg.version || 'unknown';
		} catch {
			// Ignore
		}

		console.log(`🎯 Obsidian Plugin Config - Local Injection Tool v${version}`);
		console.log(`📥 Inject autonomous configuration from local files\n`);

		const args = process.argv.slice(2);
		const autoConfirm = args.includes('--yes') || args.includes('-y');
		const dryRun = args.includes('--dry-run') || args.includes('--check');
		const useSass = args.includes('--sass');
		const targetPath = args.find((arg) => !arg.startsWith('-'));

		if (!targetPath) {
			console.error(`❌ Usage: yarn inject-path <plugin-directory> [options]`);
			console.error(`   Example: yarn inject-path ../my-obsidian-plugin`);
			console.error(`   Options:`);
			console.error(`     --yes, -y           Auto-confirm injection`);
			console.error(`     --dry-run           Check only (no injection)`);
			console.error(`     --sass              Add esbuild-sass-plugin dependency`);
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
		if (fs.existsSync(selfPkg)) {
			const pkg = JSON.parse(fs.readFileSync(selfPkg, 'utf8'));
			if (pkg.name === 'obsidian-plugin-config') {
				console.error(`❌ Cannot inject into obsidian-plugin-config itself.`);
				process.exit(1);
			}
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
			console.log(
				`🎨 SASS support: ${useSass ? '✅ (esbuild-sass-plugin will be added)' : '❌'}`
			);

			if (!plan.isObsidianPlugin) {
				console.log(
					`\n⚠️  Warning: This doesn't appear to be a valid Obsidian plugin`
				);
				console.log(`   Missing manifest.json or invalid structure`);
			}

			console.log(`\n📋 Would inject:`);
			console.log(
				`   ✅ Local scripts (utils.ts, esbuild.config.ts, acp.ts, etc.)`
			);
			console.log(`   ✅ Updated package.json scripts`);
			console.log(`   ✅ Required dependencies`);
			console.log(
				`   🔍 Analyze centralized imports (manual commenting may be needed)`
			);

			const injectionInfo = readInjectionInfo(resolvedPath);

			if (injectionInfo) {
				console.log(`\n✅ Status: Plugin is already injected`);
				console.log(`   📦 Injector: ${injectionInfo.injectorName || 'unknown'}`);
				console.log(
					`   🏷️  Version: ${injectionInfo.injectorVersion || 'unknown'}`
				);
				console.log(
					`   📅 Date: ${
						injectionInfo.injectionDate
							? new Date(injectionInfo.injectionDate).toLocaleDateString()
							: 'unknown'
					}`
				);

				const configRoot = findPluginConfigRoot();
				try {
					const configPackageJson = JSON.parse(
						fs.readFileSync(path.join(configRoot, 'package.json'), 'utf8')
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
				const hasInjectedScripts = fs.existsSync(
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

		const confirmed = await showInjectionPlan(plan, autoConfirm, useSass);

		if (!confirmed) {
			console.log(`❌ Injection cancelled by user`);
			process.exit(0);
		}

		await performInjection(resolvedPath, autoConfirm, useSass);
	} catch (error) {
		console.error(
			`💥 Error: ${error instanceof Error ? error.message : String(error)}`
		);
		process.exit(1);
	} finally {
		rl.close();
	}
}

main().catch(console.error);
