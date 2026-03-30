#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Generate bin/obsidian-inject.js from template
 */
async function generateBinFile(): Promise<void> {
	console.log(`\n🔧 Generating bin/obsidian-inject.js...`);

	const binDir = 'bin';
	const binPath = path.join(binDir, 'obsidian-inject.js');

	// Ensure bin directory exists
	if (!fs.existsSync(binDir)) {
		fs.mkdirSync(binDir, { recursive: true });
		console.log(`   📁 Created ${binDir} directory`);
	}

	// Read package.json for version info
	const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

	const binContent = `#!/usr/bin/env node

/**
 * Obsidian Plugin Config - CLI Entry Point
 * Global command: obsidian-inject
 * Version: ${packageJson.version}
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute, resolve } from 'path';
import fs from 'fs';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = dirname(__dirname);

// Path to the injection script
const injectScriptPath = join(packageRoot, 'scripts', 'inject-path.ts');

function showHelp() {
  console.log(\`
Obsidian Plugin Config - Global CLI
Injection system for autonomous Obsidian plugins

USAGE:
  obsidian-inject                    # Inject in current directory
  obsidian-inject <path>             # Inject by path
  obsidian-inject <path> --sass      # Inject with SASS support
  obsidian-inject --help, -h         # Show this help

EXAMPLES:
  cd my-plugin && obsidian-inject
  obsidian-inject ../my-other-plugin
  obsidian-inject ../my-plugin --sass
  obsidian-inject "C:\\\\Users\\\\dev\\\\plugins\\\\my-plugin"

WHAT IS INJECTED:
  ✅ Local scripts (esbuild.config.ts, acp.ts, utils.ts, etc.)
  ✅ Package.json configuration (scripts, dependencies)
  ✅ Yarn protection enforced
  ✅ Automatic dependency installation
  🎨 SASS support (with --sass option): esbuild-sass-plugin + SCSS compilation

ARCHITECTURE:
  - Plugin becomes AUTONOMOUS with local scripts
  - No external dependencies required after injection
  - Updates possible via re-injection

More info: https://github.com/3C0D/obsidian-plugin-config
\`);
}

function main() {
  const args = process.argv.slice(2);

  // Handle help flags
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Check if injection script exists
  if (!fs.existsSync(injectScriptPath)) {
    console.error(\`❌ Error: Injection script not found at \${injectScriptPath}\`);
    console.error(\`   Make sure obsidian-plugin-config is properly installed.\`);
    process.exit(1);
  }

  // Parse arguments
  const sassFlag = args.includes('--sass');
  const pathArg = args.find(arg => !arg.startsWith('-'));

  // Determine target path (resolve relative to user's current directory)
  const userCwd = process.cwd();
  let targetPath = pathArg || userCwd;

  // If relative path, resolve from user's current directory
  if (pathArg && !isAbsolute(pathArg)) {
    targetPath = resolve(userCwd, pathArg);
  }

  console.log(\`🎯 Obsidian Plugin Config - Global Injection\`);
  console.log(\`📁 Target: \${targetPath}\`);
  console.log(\`🎨 SASS: \${sassFlag ? 'Enabled' : 'Disabled'}\`);
  console.log(\`📦 From: \${packageRoot}\\n\`);

  try {
    // Check if target directory has package.json
    const targetPackageJson = join(targetPath, 'package.json');
    if (!fs.existsSync(targetPackageJson)) {
      console.error(\`❌ Error: package.json not found in \${targetPath}\`);
      console.error(\`   Make sure this is a valid Node.js project.\`);
      process.exit(1);
    }

    // Clean NPM artifacts if package-lock.json exists
    const packageLockPath = join(targetPath, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      console.log(\`🧹 NPM installation detected, cleaning...\`);

      try {
        // Remove package-lock.json
        fs.unlinkSync(packageLockPath);
        console.log(\`   🗑️  package-lock.json removed\`);

        // Remove node_modules if it exists
        const nodeModulesPath = join(targetPath, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          fs.rmSync(nodeModulesPath, { recursive: true, force: true });
          console.log(\`   🗑️  node_modules removed (will be reinstalled with Yarn)\`);
        }

        console.log(\`   ✅ NPM artifacts cleaned to avoid Yarn conflicts\`);

      } catch (cleanError) {
        console.error(\`   ❌ Cleanup failed:\`, cleanError.message);
        console.log(\`   💡 Manually remove package-lock.json and node_modules\`);
      }
    }

    // Check if tsx is available locally in target
    let tsxCommand = 'npx tsx';
    try {
      execSync('npx tsx --version', {
        cwd: targetPath,
        stdio: 'pipe'
      });
      console.log(\`✅ tsx available locally\`);
    } catch {
      console.log(\`⚠️  tsx not found, installing...\`);

      // Install tsx locally in target directory
      try {
        execSync('yarn add -D tsx', {
          cwd: targetPath,
          stdio: 'inherit'
        });
        console.log(\`✅ tsx installed successfully\`);
      } catch (installError) {
        console.error(\`❌ tsx installation failed:\`, installError.message);
        console.error(\`   Try installing tsx manually: cd "\${targetPath}" && yarn add -D tsx\`);
        process.exit(1);
      }
    }

    // Execute the injection script with tsx
    const sassOption = sassFlag ? ' --sass' : '';
    const command = \`npx tsx "\${injectScriptPath}" "\${targetPath}" --yes\${sassOption}\`;

    execSync(command, {
      stdio: 'inherit',
      cwd: targetPath  // Use target directory to ensure tsx is available
    });

    console.log(\`\\n✅ Injection completed successfully!\`);

  } catch (error) {
    console.error(\`\\n❌ Injection error:\`, error.message);
    process.exit(1);
  }
}

// Run the CLI
main();
`;

	fs.writeFileSync(binPath, binContent, 'utf8');
	console.log(`   ✅ Generated ${binPath}`);
}

/**
 * Complete NPM workflow - Version, Commit, Push, Publish
 */
async function buildAndPublishNpm(): Promise<void> {
	console.log(`🚀 Obsidian Plugin Config - Complete NPM Workflow`);
	console.log(`Full automation: version → exports → bin → commit → publish\n`);

	try {
		// Step 0: Check NPM login
		console.log(`🔐 Checking NPM authentication...`);
		try {
			const whoami = execSync('npm whoami --registry https://registry.npmjs.org/', {
				stdio: 'pipe',
				encoding: 'utf8'
			}).trim();
			console.log(`   ✅ Logged in as: ${whoami}\n`);
		} catch {
			console.error(`   ❌ Not logged in to NPM. Run: npm login`);
			process.exit(1);
		}

		// Step 1: Update version
		console.log(`📋 Step 1/7: Updating version...`);
		execSync('tsx scripts/update-version-config.ts', { stdio: 'inherit' });

		// Step 2: Update exports
		console.log(`\n📦 Step 2/7: Updating exports...`);
		execSync('yarn update-exports', { stdio: 'inherit' });

		// Step 3: Generate bin file
		console.log(`\n🔧 Step 3/7: Generating bin/obsidian-inject.js...`);
		await generateBinFile();

		// Step 4: Verify package and sync versions.json
		console.log(`\n📋 Step 4/7: Verifying package...`);
		verifyPackage();

		// Step 5: Commit and push
		console.log(`\n📤 Step 5/7: Committing and pushing changes...`);
		try {
			execSync('echo "Publish NPM package" | tsx scripts/acp.ts -b', {
				stdio: 'inherit'
			});
		} catch {
			console.log(`   ℹ️  No additional changes to commit`);
		}

		// Step 6: Publish to NPM
		console.log(`\n📤 Step 6/7: Publishing to NPM...`);
		execSync('npm publish --registry https://registry.npmjs.org/', {
			stdio: 'inherit'
		});

		// Step 7: Offer global update
		console.log(`\n🌍 Step 7/7: Update global CLI?`);
		const { askConfirmation, createReadlineInterface } = await import('./utils.js');
		const rl = createReadlineInterface();
		const doUpdate = await askConfirmation(
			`Install npm install -g obsidian-plugin-config@latest?`,
			rl
		);
		rl.close();
		if (doUpdate) {
			execSync(
				'npm install -g obsidian-plugin-config@latest --force --engine-strict=false',
				{ stdio: 'inherit' }
			);
			console.log(`   ✅ Global CLI updated`);
		}

		console.log(`\n🎉 Complete workflow successful!`);
		console.log(`   Test: cd any-plugin && obsidian-inject`);
	} catch (error) {
		console.error(
			`\n❌ Workflow failed: ${error instanceof Error ? error.message : String(error)}`
		);
		process.exit(1);
	}
}

/**
 * Verify package is ready for publication
 */
function verifyPackage(): void {
	// Check required scripts
	const requiredScripts = [
		'scripts/inject-path.ts',
		'scripts/inject-prompt.ts',
		'scripts/utils.ts',
		'scripts/esbuild.config.ts',
		'scripts/acp.ts',
		'scripts/update-version-config.ts',
		'scripts/help.ts'
	];

	for (const script of requiredScripts) {
		if (!fs.existsSync(script)) {
			throw new Error(`Missing required script: ${script}`);
		}
	}
	console.log(`   ✅ All required scripts present`);

	// Check package.json
	const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	const requiredFields = [
		'name',
		'version',
		'description',
		'bin',
		'repository',
		'author'
	];

	for (const field of requiredFields) {
		if (!packageJson[field]) {
			throw new Error(`Missing required package.json field: ${field}`);
		}
	}
	console.log(`   ✅ Package.json valid (v${packageJson.version})`);

	// Check bin file exists
	if (!fs.existsSync('bin/obsidian-inject.js')) {
		throw new Error(`Missing bin file: bin/obsidian-inject.js`);
	}
	console.log(`   ✅ Bin file ready`);

	// Sync versions.json
	const versionsPath = 'versions.json';
	let versions: Record<string, string> = {};

	if (fs.existsSync(versionsPath)) {
		versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
	}

	if (!versions[packageJson.version]) {
		const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
		versions[packageJson.version] = manifest.minAppVersion;
		fs.writeFileSync(versionsPath, JSON.stringify(versions, null, '\t'), 'utf8');
		console.log(`   ✅ Added version ${packageJson.version} to versions.json`);
	} else {
		console.log(`   ✅ Version ${packageJson.version} in versions.json`);
	}

	// Quick build test
	execSync('yarn build', { stdio: 'pipe' });
	console.log(`   ✅ Build test passed`);
}

// Run the script
await buildAndPublishNpm();
