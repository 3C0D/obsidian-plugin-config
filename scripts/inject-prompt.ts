#!/usr/bin/env tsx

import path from 'path';
import {
	analyzePlugin,
	ensurePluginConfigClean,
	performInjection,
	showInjectionPlan
} from './inject-core.js';
import {
	askConfirmation,
	askQuestion,
	createReadlineInterface,
	isValidPath
} from './utils.js';

const rl = createReadlineInterface();

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

		const cleanPath = rawInput.trim().replace(/^["']|["']$/g, '');
		const resolvedPath = path.resolve(cleanPath);

		if (!(await isValidPath(resolvedPath))) {
			console.log(`❌ Directory not found: ${resolvedPath}`);
			const retry = await askConfirmation(`Try again?`, rl);
			if (!retry) throw new Error('User cancelled');
			continue;
		}

		console.log(`📁 Target directory: ${resolvedPath}`);
		return resolvedPath;
	}
}

async function main(): Promise<void> {
	try {
		console.log(`🎯 Obsidian Plugin Config - Interactive Injection Tool`);
		console.log(`📥 Inject autonomous configuration with prompts\n`);

		const args = process.argv.slice(2);
		const useSass = args.includes('--sass');
		let targetPath: string;

		const pathArg = args.find((arg) => !arg.startsWith('-'));
		if (pathArg) {
			const cleanPath = pathArg.trim().replace(/^["']|["']$/g, '');
			targetPath = path.resolve(cleanPath);

			if (!(await isValidPath(targetPath))) {
				console.error(`❌ Directory not found: ${targetPath}`);
				process.exit(1);
			}

			console.log(`📁 Using provided path: ${targetPath}`);
		} else {
			targetPath = await promptForTargetPath();
		}

		console.log(`\n🔍 Checking plugin-config repository status...`);
		await ensurePluginConfigClean();

		console.log(`\n🔍 Analyzing plugin...`);
		const plan = await analyzePlugin(targetPath);

		const confirmed = await showInjectionPlan(plan, false, useSass);

		if (!confirmed) {
			console.log(`❌ Injection cancelled by user`);
			process.exit(0);
		}

		await performInjection(targetPath, useSass);
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
