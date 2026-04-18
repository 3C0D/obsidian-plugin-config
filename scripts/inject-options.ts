#!/usr/bin/env tsx

import type { Interface } from 'readline';

export interface InjectionOptions {
	scripts: boolean;
	packageJson: boolean;
	tsconfig: boolean;
	eslint: boolean;
	prettier: boolean;
	editorconfig: boolean;
	vscode: boolean;
	github: boolean;
	gitignore: boolean;
	env: boolean;
}

export const DEFAULT_OPTIONS: InjectionOptions = {
	scripts: true,
	packageJson: true,
	tsconfig: true,
	eslint: true,
	prettier: true,
	editorconfig: true,
	vscode: true,
	github: true,
	gitignore: true,
	env: true
};

const OPTION_DESCRIPTIONS: Record<keyof InjectionOptions, string> = {
	scripts: 'Scripts (esbuild.config.ts, acp.ts, utils.ts, etc.)',
	packageJson: 'package.json (scripts & dependencies)',
	tsconfig: 'tsconfig.json',
	eslint: 'eslint.config.mts',
	prettier: '.prettierrc & .prettierignore',
	editorconfig: '.editorconfig',
	vscode: '.vscode/ (settings.json, tasks.json, extensions.json)',
	github: '.github/workflows/ (release workflow)',
	gitignore: '.gitignore',
	env: '.env (template)'
};

/**
 * Ask user to select which files to inject
 */
export async function askInjectionOptions(
	rl: Interface
): Promise<InjectionOptions> {
	const { askConfirmation } = await import('./utils.js');

	console.log(`\n🎯 Injection Options`);
	console.log(`Select what you want to inject (default: all)\n`);

	const useDefaults = await askConfirmation(
		'Use default options (inject everything)?',
		rl
	);

	if (useDefaults) {
		console.log(`✅ Using default options (all files will be injected)`);
		return DEFAULT_OPTIONS;
	}

	console.log(`\n📋 Select individual options:\n`);

	const options: InjectionOptions = { ...DEFAULT_OPTIONS };

	for (const [key, description] of Object.entries(OPTION_DESCRIPTIONS)) {
		const optionKey = key as keyof InjectionOptions;
		const answer = await askConfirmation(`Inject ${description}?`, rl);
		options[optionKey] = answer;
	}

	// Display summary
	console.log(`\n📋 Selected options:`);
	for (const [key, value] of Object.entries(options)) {
		const optionKey = key as keyof InjectionOptions;
		const icon = value ? '✅' : '❌';
		console.log(`   ${icon} ${OPTION_DESCRIPTIONS[optionKey]}`);
	}

	const confirm = await askConfirmation('\nProceed with these options?', rl);
	if (!confirm) {
		console.log('❌ Injection cancelled');
		process.exit(0);
	}

	return options;
}

/**
 * Get quick preset options
 */
export function getPresetOptions(preset: string): InjectionOptions {
	switch (preset) {
		case 'minimal':
			return {
				scripts: true,
				packageJson: true,
				tsconfig: false,
				eslint: false,
				prettier: false,
				editorconfig: false,
				vscode: false,
				github: false,
				gitignore: false,
				env: true
			};
		case 'scripts-only':
			return {
				scripts: true,
				packageJson: false,
				tsconfig: false,
				eslint: false,
				prettier: false,
				editorconfig: false,
				vscode: false,
				github: false,
				gitignore: false,
				env: false
			};
		case 'config-only':
			return {
				scripts: false,
				packageJson: false,
				tsconfig: true,
				eslint: true,
				prettier: true,
				editorconfig: true,
				vscode: true,
				github: false,
				gitignore: true,
				env: false
			};
		default:
			return DEFAULT_OPTIONS;
	}
}
