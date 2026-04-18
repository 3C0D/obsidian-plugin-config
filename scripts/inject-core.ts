#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { isValidPath, gitExec } from './utils.js';
import type { InjectionOptions } from './inject-options.js';

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
	const packageJsonPath = path.join(pluginPath, 'package.json');
	const manifestPath = path.join(pluginPath, 'manifest.json');
	const scriptsPath = path.join(pluginPath, 'scripts');

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
			const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
			plan.isObsidianPlugin = !!(manifest.id && manifest.name && manifest.version);
		} catch {
			console.warn('Warning: Could not parse manifest.json');
		}
	}

	if (plan.hasPackageJson) {
		try {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
			plan.currentDependencies = [
				...Object.keys(packageJson.dependencies || {}),
				...Object.keys(packageJson.devDependencies || {})
			];
		} catch {
			console.warn('Warning: Could not parse package.json');
		}
	}

	return plan;
}

/**
 * Find plugin-config root directory (handles NPM global installs)
 */
export function findPluginConfigRoot(): string {
	const scriptDir = path.dirname(fileURLToPath(import.meta.url));
	const npmPackageRoot = path.resolve(scriptDir, '..');
	const npmPackageJson = path.join(npmPackageRoot, 'package.json');

	if (fs.existsSync(npmPackageJson)) {
		try {
			const packageContent = JSON.parse(fs.readFileSync(npmPackageJson, 'utf8'));
			if (packageContent.name === 'obsidian-plugin-config') {
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
		return fs.readFileSync(sourcePath, 'utf8');
	} catch (error) {
		throw new Error(`Failed to copy ${filePath}: ${error}`);
	}
}

/**
 * Check if plugin-config repo is clean and commit if needed
 */
export async function ensurePluginConfigClean(): Promise<void> {
	const configRoot = findPluginConfigRoot();
	const gitDir = path.join(configRoot, '.git');

	// Skip git check if not a git repo
	// (e.g. NPM global install)
	if (!fs.existsSync(gitDir)) {
		console.log(`✅ Plugin-config repo is clean` + ` (NPM install, no git check)`);
		return;
	}

	const originalCwd = process.cwd();

	try {
		process.chdir(configRoot);
		const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();

		if (gitStatus) {
			console.log(`\n⚠️  Plugin-config has uncommitted changes:`);
			console.log(gitStatus);
			console.log(`\n🔧 Auto-committing changes...`);

			const msg = '🔧 Update plugin-config templates';
			gitExec('git add -A');
			gitExec(`git commit -m "${msg}"`);

			try {
				const branch = execSync('git rev-parse --abbrev-ref HEAD', {
					encoding: 'utf8'
				}).trim();
				gitExec(`git push origin ${branch}`);
				console.log(`✅ Changes committed and pushed`);
			} catch {
				try {
					const branch = execSync('git rev-parse --abbrev-ref HEAD', {
						encoding: 'utf8'
					}).trim();
					gitExec(`git push --set-upstream origin ${branch}`);
					console.log(`✅ New branch pushed with upstream`);
				} catch {
					console.log(`⚠️  Committed locally, push failed`);
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
	const { askConfirmation, createReadlineInterface } = await import('./utils.js');
	const rl = createReadlineInterface();

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
export async function cleanOldScripts(
	scriptsPath: string,
	approvedDests: Set<string>
): Promise<void> {
	const scriptNames = [
		'utils',
		'esbuild.config',
		'acp',
		'update-version',
		'release',
		'help'
	];
	const extensions = ['.ts', '.mts', '.js', '.mjs'];

	for (const scriptName of scriptNames) {
		for (const ext of extensions) {
			const scriptFile = path.join(scriptsPath, `${scriptName}${ext}`);
			if (await isValidPath(scriptFile)) {
				if (approvedDests.has(scriptFile)) {
					fs.unlinkSync(scriptFile);
					console.log(`🗑️  Removed existing ${scriptName}${ext} (will be replaced)`);
				}
			}
		}
	}

	const obsoleteRootFiles = ['help-plugin.ts'];
	for (const fileName of obsoleteRootFiles) {
		const filePath = path.join(path.dirname(scriptsPath), fileName);
		if (await isValidPath(filePath)) {
			fs.unlinkSync(filePath);
			console.log(`🗑️  Removed obsolete root file: ${fileName}`);
		}
	}

	const obsoleteFiles = ['start.mjs', 'start.js'];
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
	const oldLintFiles = ['.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintignore'];
	const conflictingLintFiles = [
		'eslint.config.ts',
		'eslint.config.cjs',
		'eslint.config.js',
		'eslint.config.mjs'
	];

	for (const fileName of oldLintFiles) {
		const filePath = path.join(targetPath, fileName);
		if (await isValidPath(filePath)) {
			fs.unlinkSync(filePath);
			console.log(
				`🗑️  Removed old ESLint file: ${fileName} (replaced by eslint.config.ts)`
			);
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

interface FileEntry {
	src: string; // path relative to configRoot
	dest: string; // absolute path in target plugin
	optionKey: keyof InjectionOptions | null; // null = always inject
	mergeEnv?: boolean; // special .env merge logic
}

/**
 * Build the full list of files to inject, with source and destination paths
 */
function buildFileList(targetPath: string, options: InjectionOptions): FileEntry[] {
	const scriptsPath = path.join(targetPath, 'scripts');
	const entries: FileEntry[] = [];

	// Scripts
	const scriptFiles = [
		'templates/scripts/utils.ts',
		'templates/scripts/esbuild.config.ts',
		'templates/scripts/acp.ts',
		'templates/scripts/update-version.ts',
		'templates/scripts/release.ts',
		'templates/scripts/help.ts'
	];
	for (const src of scriptFiles) {
		entries.push({
			src,
			dest: path.join(scriptsPath, path.basename(src)),
			optionKey: 'scripts'
		});
	}

	// Root config files
	const configFileMap: Array<[string, string, keyof InjectionOptions | null, boolean?]> =
		[
			['templates/tsconfig.json', 'tsconfig.json', 'tsconfig'],
			['templates/gitignore.template', '.gitignore', 'gitignore'],
			['templates/eslint.config.mts', 'eslint.config.mts', 'eslint'],
			['templates/.editorconfig', '.editorconfig', 'editorconfig'],
			['templates/.prettierrc', '.prettierrc', 'prettier'],
			['templates/npmrc.template', '.npmrc', null],
			['templates/env.template', '.env', 'env', true]
		];
	for (const [src, destName, optionKey, mergeEnv] of configFileMap) {
		entries.push({
			src,
			dest: path.join(targetPath, destName),
			optionKey,
			mergeEnv: !!mergeEnv
		});
	}

	// VSCode config files
	const configVscodeMap: Array<[string, string]> = [
		['templates/.vscode/settings.json', '.vscode/settings.json'],
		['templates/.vscode/tasks.json', '.vscode/tasks.json']
	];
	for (const [src, destName] of configVscodeMap) {
		entries.push({
			src,
			dest: path.join(targetPath, destName),
			optionKey: 'vscode'
		});
	}

	// GitHub workflow files
	const workflowFiles = [
		'templates/.github/workflows/release.yml',
		'templates/.github/workflows/release-body.md'
	];
	for (const src of workflowFiles) {
		entries.push({
			src,
			dest: path.join(targetPath, src.replace('templates/', '')),
			optionKey: 'github'
		});
	}

	return entries;
}

/**
 * Compare source templates with existing target files.
 * Prompt user only when content differs and file already exists.
 * Returns the Set of dest paths approved for injection.
 */
export async function diffAndPromptFiles(
	targetPath: string,
	options: InjectionOptions
): Promise<Set<string>> {
	const { askConfirmation, createReadlineInterface } = await import('./utils.js');
	const rl = createReadlineInterface();
	const configRoot = findPluginConfigRoot();
	const entries = buildFileList(targetPath, options);
	const approved = new Set<string>();

	console.log(`\n🔍 Comparing files with existing content...`);

	let hasChanges = false;

	for (const entry of entries) {
		// Skip if disabled by options
		if (entry.optionKey !== null && !options[entry.optionKey]) continue;
		// Skip .env merge (always approved, merge logic handled separately)
		if (entry.mergeEnv) {
			approved.add(entry.dest);
			continue;
		}

		const srcPath = path.join(configRoot, entry.src);
		let srcContent: string;
		try {
			srcContent = fs.readFileSync(srcPath, 'utf8');
		} catch {
			// Source doesn't exist, skip
			continue;
		}

		// Target doesn't exist yet → inject without prompting
		if (!fs.existsSync(entry.dest)) {
			approved.add(entry.dest);
			continue;
		}

		const destContent = fs.readFileSync(entry.dest, 'utf8');

		// Identical → skip silently
		if (srcContent === destContent) {
			console.log(`   ✅ ${path.relative(targetPath, entry.dest)} (unchanged)`);
			continue;
		}

		// Different → ask user
		hasChanges = true;
		const relDest = path.relative(targetPath, entry.dest);
		const update = await askConfirmation(
			`   Update ${relDest}? (content differs)`,
			rl
		);
		if (update) {
			approved.add(entry.dest);
		} else {
			console.log(`   ⏭️  Kept existing ${relDest}`);
		}
	}

	if (!hasChanges) {
		console.log(`   ✅ All existing files are up to date`);
	}

	rl.close();
	return approved;
}

/**
 * Inject scripts and config files
 */
export async function injectScripts(
	targetPath: string,
	options: InjectionOptions,
	approvedDests: Set<string>
): Promise<void> {
	const scriptsPath = path.join(targetPath, 'scripts');

	if (!(await isValidPath(scriptsPath))) {
		fs.mkdirSync(scriptsPath, { recursive: true });
		console.log(`📁 Created scripts directory`);
	}

	await cleanOldScripts(scriptsPath, approvedDests);
	await cleanOldLintFiles(targetPath);

	const scriptFiles = [
		'templates/scripts/utils.ts',
		'templates/scripts/esbuild.config.ts',
		'templates/scripts/acp.ts',
		'templates/scripts/update-version.ts',
		'templates/scripts/release.ts',
		'templates/scripts/help.ts'
	];

	// Files that need value-preserving merge instead
	// of full overwrite (user fills in their paths)
	const mergeEnvFile = new Set(['.env']);

	// Files with .template suffix (NPM excludes dotfiles)
	// Map: { source: targetName }
	const configFileMap: Record<string, string> = {
		'templates/tsconfig.json': 'tsconfig.json',
		'templates/gitignore.template': '.gitignore',
		'templates/eslint.config.mts': 'eslint.config.mts',
		'templates/.editorconfig': '.editorconfig',
		'templates/.prettierrc': '.prettierrc',
		'templates/npmrc.template': '.npmrc',
		'templates/env.template': '.env'
	};

	const configVscodeMap: Record<string, string> = {
		'templates/.vscode/settings.json': '.vscode/settings.json',
		'templates/.vscode/tasks.json': '.vscode/tasks.json'
	};

	const workflowFiles = [
		'templates/.github/workflows/release.yml',
		'templates/.github/workflows/release-body.md'
	];

	console.log(`\n📥 Copying scripts from local files...`);

	if (options.scripts) {
		for (const scriptFile of scriptFiles) {
			try {
				const fileName = path.basename(scriptFile);
				const targetFile = path.join(scriptsPath, fileName);
				if (!approvedDests.has(targetFile)) {
					console.log(`   ⏭️  Skipped ${fileName} (kept existing)`);
					continue;
				}
				const content = copyFromLocal(scriptFile);
				fs.writeFileSync(targetFile, content, 'utf8');
				console.log(`   ✅ ${fileName}`);
			} catch (error) {
				console.error(`   ❌ Failed to inject ${scriptFile}: ${error}`);
			}
		}
	} else {
		console.log(`   ⏭️  Skipped (user choice)`);
	}

	console.log(`\n📥 Copying config files...`);

	// Copy root config files
	for (const [src, destName] of Object.entries(configFileMap)) {
		// Check if this file should be injected based on options
		const shouldInject =
			(destName === 'tsconfig.json' && options.tsconfig) ||
			(destName === 'eslint.config.mts' && options.eslint) ||
			(destName === '.prettierrc' && options.prettier) ||
			(destName === '.editorconfig' && options.editorconfig) ||
			(destName === '.gitignore' && options.gitignore) ||
			(destName === '.env' && options.env) ||
			(destName === '.npmrc'); // Always inject .npmrc

		if (!shouldInject) {
			console.log(`   ⏭️  Skipped ${destName} (user choice)`);
			continue;
		}

		// Skip if not approved by diff step
		const targetFile = path.join(targetPath, destName);
		if (!approvedDests.has(targetFile)) {
			continue; // already logged during diff step
		}

		try {
			const targetFile = path.join(targetPath, destName);
			const templateContent = copyFromLocal(src);

			// For .env: merge existing values into the template
			if (mergeEnvFile.has(destName) && fs.existsSync(targetFile)) {
				const existing = fs.readFileSync(targetFile, 'utf8');
				// Parse existing key=value pairs
				const existingVals: Record<string, string> = {};
				for (const line of existing.split(/\r?\n/)) {
					const m = line.match(/^([^#=]+)=(.*)$/);
					if (m) existingVals[m[1].trim()] = m[2].trim();
				}
				// Re-write template, substituting existing values
				const merged = templateContent
					.split(/\r?\n/)
					.map((line) => {
						const m = line.match(/^([^#=]+)=(.*)$/);
						if (m) {
							const key = m[1].trim();
							const val = existingVals[key] ?? m[2].trim();
							return `${key}=${val}`;
						}
						return line;
					})
					.join('\n');
				fs.writeFileSync(targetFile, merged, 'utf8');
				console.log(`   ✅ ${destName} (values preserved)`);
				continue;
			}

			fs.writeFileSync(targetFile, templateContent, 'utf8');
			console.log(`   ✅ ${destName}`);
		} catch (error) {
			console.error(`   ❌ Failed to inject ${destName}: ${error}`);
		}
	}

	// Copy .vscode config files
	if (options.vscode) {
		for (const [src, destName] of Object.entries(configVscodeMap)) {
			try {
				const targetFile = path.join(targetPath, destName);
				if (!approvedDests.has(targetFile)) continue;
				const content = copyFromLocal(src);
				const targetDir = path.dirname(targetFile);
				if (!(await isValidPath(targetDir))) {
					fs.mkdirSync(targetDir, { recursive: true });
				}
				fs.writeFileSync(targetFile, content, 'utf8');
				console.log(`   ✅ ${destName}`);
			} catch (error) {
				console.error(`   ❌ Failed to inject ${destName}: ${error}`);
			}
		}
	} else {
		console.log(`   ⏭️  Skipped .vscode/ (user choice)`);
	}

	console.log(`\n📥 Copying GitHub workflows from local files...`);

	if (options.github) {
		for (const workflowFile of workflowFiles) {
			try {
				const content = copyFromLocal(workflowFile);
				const relativePath = workflowFile.replace('templates/', '');
				const targetFile = path.join(targetPath, relativePath);
				if (!approvedDests.has(targetFile)) continue;
				const targetDir = path.dirname(targetFile);

				if (!(await isValidPath(targetDir))) {
					fs.mkdirSync(targetDir, { recursive: true });
				}

				fs.writeFileSync(targetFile, content, 'utf8');
				console.log(`   ✅ ${relativePath}`);
			} catch (error) {
				console.error(`   ❌ Failed to inject ${workflowFile}: ${error}`);
			}
		}
	} else {
		console.log(`   ⏭️  Skipped (user choice)`);
	}
}

/**
 * Update package.json with autonomous configuration
 */
export async function updatePackageJson(
	targetPath: string,
	options: InjectionOptions,
	useSass: boolean = false
): Promise<void> {
	const packageJsonPath = path.join(targetPath, 'package.json');

	if (!(await isValidPath(packageJsonPath))) {
		console.log(`❌ No package.json found, skipping package.json update`);
		return;
	}

	if (!options.packageJson) {
		console.log(`⏭️  Skipped package.json update (user choice)`);
		return;
	}

	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

		const configRoot = findPluginConfigRoot();
		const templatePkg = JSON.parse(
			fs.readFileSync(path.join(configRoot, 'templates/package.json'), 'utf8')
		);

		if (useSass) {
			const sassPkg = JSON.parse(
				fs.readFileSync(
					path.join(configRoot, 'templates/package-sass.json'),
					'utf8'
				)
			);
			Object.assign(templatePkg.devDependencies, sassPkg.devDependencies);
		}

		const obsoleteScripts = ['version'];
		for (const script of obsoleteScripts) {
			if (packageJson.scripts?.[script]) {
				console.log(`   🧹 Removing obsolete script: "${script}"`);
				delete packageJson.scripts[script];
			}
		}

		packageJson.scripts = {
			...packageJson.scripts,
			...templatePkg.scripts
		};

		if (!packageJson.devDependencies) packageJson.devDependencies = {};

		const requiredDeps: Record<string, string> = templatePkg.devDependencies;

		let addedDeps = 0;
		let updatedDeps = 0;
		for (const [dep, version] of Object.entries(requiredDeps)) {
			if (!packageJson.devDependencies[dep]) {
				packageJson.devDependencies[dep] = version as string;
				addedDeps++;
			} else if (packageJson.devDependencies[dep] !== version) {
				packageJson.devDependencies[dep] = version as string;
				updatedDeps++;
			}
		}

		if (!packageJson.engines) packageJson.engines = {};
		packageJson.engines.npm = templatePkg.engines.npm;
		packageJson.engines.yarn = templatePkg.engines.yarn;
		packageJson.type = templatePkg.type;

		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
		console.log(
			`   ✅ Updated package.json (${addedDeps} new, ${updatedDeps} updated dependencies)`
		);
	} catch (error) {
		console.error(`   ❌ Failed to update package.json: ${error}`);
	}
}

/**
 * Analyze centralized imports in source files (without modifying)
 */
export async function analyzeCentralizedImports(targetPath: string): Promise<void> {
	const srcPath = path.join(targetPath, 'src');

	if (!(await isValidPath(srcPath))) {
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
				const importRegex =
					/import\s+.*from\s+["']obsidian-plugin-config[^"']*["']/g;
				if (importRegex.test(content)) {
					filesWithImports++;
					console.log(
						`   ⚠️  ${path.relative(targetPath, filePath)} - contains centralized imports`
					);
				}
			} catch (error) {
				console.warn(
					`   ⚠️  Could not analyze ${path.relative(targetPath, filePath)}: ${error}`
				);
			}
		}

		if (filesWithImports === 0) {
			console.log(`   ✅ No centralized imports found`);
		} else {
			console.log(
				`   ⚠️  Found ${filesWithImports} files with centralized imports`
			);
			console.log(
				`   💡 You may need to manually comment these imports for the plugin to work`
			);
		}
	} catch (error) {
		console.error(`   ❌ Failed to analyze imports: ${error}`);
	}
}

/**
 * Create required directories
 */
export async function createRequiredDirectories(targetPath: string): Promise<void> {
	const directories = [path.join(targetPath, '.github', 'workflows')];

	for (const dir of directories) {
		if (!(await isValidPath(dir))) {
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
	const configPackageJsonPath = path.join(configRoot, 'package.json');

	let injectorVersion = 'unknown';
	try {
		const configPackageJson = JSON.parse(
			fs.readFileSync(configPackageJsonPath, 'utf8')
		);
		injectorVersion = configPackageJson.version || 'unknown';
	} catch {
		console.warn('Warning: Could not read injector version');
	}

	const injectionInfo = {
		injectorVersion,
		injectionDate: new Date().toISOString(),
		injectorName: 'obsidian-plugin-config'
	};

	const infoPath = path.join(targetPath, '.injection-info.json');
	fs.writeFileSync(infoPath, JSON.stringify(injectionInfo, null, 2));
	console.log(`   ✅ Created injection info file (.injection-info.json)`);
}

/**
 * Read injection info from target plugin
 */
export function readInjectionInfo(targetPath: string): Record<string, string> | null {
	const infoPath = path.join(targetPath, '.injection-info.json');

	if (!fs.existsSync(infoPath)) return null;

	try {
		return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
	} catch {
		console.warn('Warning: Could not parse .injection-info.json');
		return null;
	}
}

/**
 * Clean NPM/Yarn lock files and node_modules to ensure fresh install
 */
export async function cleanNpmArtifactsIfNeeded(targetPath: string): Promise<void> {
	const packageLockPath = path.join(targetPath, 'package-lock.json');
	const yarnLockPath = path.join(targetPath, 'yarn.lock');
	const nodeModulesPath = path.join(targetPath, 'node_modules');

	const hasPackageLock = fs.existsSync(packageLockPath);
	const hasYarnLock = fs.existsSync(yarnLockPath);

	if (hasPackageLock) {
		console.log(`\n🧹 Cleaning NPM artifacts (migrating to Yarn)...`);

		try {
			// Remove node_modules FIRST (before lock files)
			if (fs.existsSync(nodeModulesPath)) {
				console.log(`   ⏳ Removing node_modules (this may take a moment)...`);
				
				execSync(`rmdir /s /q "${nodeModulesPath}"`, {
					stdio: 'pipe',
					windowsHide: true
				});

				if (fs.existsSync(nodeModulesPath)) {
					// rmdir failed silently (locked .exe files) - rename instead
					const timestamp = Date.now();
					const oldPath = `${nodeModulesPath}.old.${timestamp}`;
					try {
						fs.renameSync(nodeModulesPath, oldPath);
						console.log(`   🔄 Renamed locked node_modules to ${path.basename(oldPath)}`);
						console.log(`   💡 Delete it manually later: ${oldPath}`);
					} catch {
						console.log(`   ⚠️  Could not remove/rename node_modules (locked by processes)`);
						console.log(`   💡 Close Obsidian/VSCode and run: obsidian-inject again`);
						throw new Error('node_modules locked - close processes and retry');
					}
				} else {
					console.log(`   🗑️  Removed node_modules (will be reinstalled with Yarn)`);
				}
			}

			// Then remove lock files
			if (hasPackageLock) {
				fs.unlinkSync(packageLockPath);
				console.log(`   🗑️  Removed package-lock.json`);
			}

			if (hasYarnLock) {
				fs.unlinkSync(yarnLockPath);
				console.log(`   🗑️  Removed yarn.lock`);
			}

			console.log(`   ✅ Lock files and artifacts cleaned for fresh install`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('locked')) {
				throw error;
			}
			console.error(`   ❌ Failed to clean artifacts: ${error}`);
			console.log(
				`   💡 You may need to manually remove package-lock.json, yarn.lock and node_modules`
			);
		}
	}
}

/**
 * Check if tsx is installed locally and install it if needed
 */
export async function ensureTsxInstalled(targetPath: string): Promise<void> {
	console.log(`\n🔍 Checking tsx installation...`);

	const packageJsonPath = path.join(targetPath, 'package.json');

	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
		const devDependencies = packageJson.devDependencies || {};
		const dependencies = packageJson.dependencies || {};

		if (devDependencies.tsx || dependencies.tsx) {
			console.log(`   ✅ tsx is already installed`);
			return;
		}

		console.log(`   ⚠️  tsx not found, installing as dev dependency...`);
		execSync('yarn add -D tsx', { cwd: targetPath, stdio: 'inherit' });
		console.log(`   ✅ tsx installed successfully`);
	} catch (error) {
		console.error(`   ❌ Failed to install tsx: ${error}`);
		console.log(`   💡 You may need to install tsx manually: yarn add -D tsx`);
		throw new Error('tsx installation failed');
	}
}

/**
 * Run yarn install in target directory
 */
export async function runYarnInstall(targetPath: string): Promise<void> {
	console.log(`\n📦 Installing dependencies...`);

	try {
		execSync('yarn install', { cwd: targetPath, stdio: 'inherit' });
		console.log(`   ✅ Dependencies installed successfully`);
	} catch (error) {
		console.error(`   ❌ Failed to install dependencies: ${error}`);
		console.log(
			`   💡 You may need to run 'yarn install' manually in the target directory`
		);
	}
}

/**
 * Main injection orchestration function
 */
export async function performInjection(
	targetPath: string,
	options: InjectionOptions,
	useSass: boolean = false
): Promise<void> {
	console.log(`\n🚀 Starting injection process...`);

	try {
		const approvedDests = await diffAndPromptFiles(targetPath, options);
		await cleanNpmArtifactsIfNeeded(targetPath);
		await ensureTsxInstalled(targetPath);
		await injectScripts(targetPath, options, approvedDests);

		console.log(`\n📦 Updating package.json...`);
		await updatePackageJson(targetPath, options, useSass);

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
		console.log(
			`   4. yarn acp      # Commit changes (or yarn bacp for build+commit)`
		);

		// Check for .old directories and remind user to delete them
		const oldDirs = fs.readdirSync(targetPath)
			.filter(name => name.startsWith('node_modules.old.'))
			.map(name => path.basename(name));
		
		if (oldDirs.length > 0) {
			console.log(`\n🧹 Cleanup reminder:`);
			for (const oldDir of oldDirs) {
				console.log(`   🗑️  Delete manually: ${oldDir}`);
			}
			console.log(`   💡 Close all processes first, then delete these folders`);
		}
	} catch (error) {
		console.error(`\n❌ Injection failed: ${error}`);
		throw error;
	}
}
