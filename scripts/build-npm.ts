#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Generate bin/obsidian-inject.js from template
 */
async function generateBinFile(): Promise<void> {
  console.log(`\n🔧 Generating bin/obsidian-inject.js...`);

  const binDir = "bin";
  const binPath = path.join(binDir, "obsidian-inject.js");

  // Ensure bin directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
    console.log(`   📁 Created ${binDir} directory`);
  }

  // Read package.json for version info
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

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
Système d'injection pour plugins Obsidian autonomes

UTILISATION:
  obsidian-inject                    # Injection dans le répertoire courant
  obsidian-inject <chemin>           # Injection par chemin
  obsidian-inject --help, -h         # Afficher cette aide

EXEMPLES:
  cd mon-plugin && obsidian-inject
  obsidian-inject ../mon-autre-plugin
  obsidian-inject "C:\\\\Users\\\\dev\\\\plugins\\\\mon-plugin"

CE QUI EST INJECTÉ:
  ✅ Scripts locaux (esbuild.config.ts, acp.ts, utils.ts, etc.)
  ✅ Configuration package.json (scripts, dépendances)
  ✅ Protection yarn obligatoire
  ✅ Installation automatique des dépendances

ARCHITECTURE:
  - Plugin devient AUTONOME avec scripts locaux
  - Aucune dépendance externe requise après injection
  - Mise à jour possible via re-injection

Pour plus d'informations: https://github.com/3C0D/obsidian-plugin-config
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
    console.error(\`❌ Erreur: Script d'injection non trouvé à \${injectScriptPath}\`);
    console.error(\`   Vérifiez que obsidian-plugin-config est correctement installé.\`);
    process.exit(1);
  }

  // Determine target path (resolve relative to user's current directory)
  const userCwd = process.cwd();
  let targetPath = args[0] || userCwd;

  // If relative path, resolve from user's current directory
  if (args[0] && !isAbsolute(args[0])) {
    targetPath = resolve(userCwd, args[0]);
  }

  console.log(\`🎯 Obsidian Plugin Config - Injection Globale\`);
  console.log(\`📁 Cible: \${targetPath}\`);
  console.log(\`📦 Depuis: \${packageRoot}\\n\`);

  try {
    // Check if target directory has package.json
    const targetPackageJson = join(targetPath, 'package.json');
    if (!fs.existsSync(targetPackageJson)) {
      console.error(\`❌ Erreur: package.json non trouvé dans \${targetPath}\`);
      console.error(\`   Assurez-vous que c'est un projet Node.js valide.\`);
      process.exit(1);
    }

    // Clean NPM artifacts if package-lock.json exists
    const packageLockPath = join(targetPath, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      console.log(\`🧹 Installation NPM détectée, nettoyage...\`);

      try {
        // Remove package-lock.json
        fs.unlinkSync(packageLockPath);
        console.log(\`   🗑️  package-lock.json supprimé\`);

        // Remove node_modules if it exists
        const nodeModulesPath = join(targetPath, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          fs.rmSync(nodeModulesPath, { recursive: true, force: true });
          console.log(\`   🗑️  node_modules supprimé (sera réinstallé avec Yarn)\`);
        }

        console.log(\`   ✅ Artefacts NPM nettoyés pour éviter les conflits Yarn\`);

      } catch (cleanError) {
        console.error(\`   ❌ Échec du nettoyage:\`, cleanError.message);
        console.log(\`   💡 Supprimez manuellement package-lock.json et node_modules\`);
      }
    }

    // Check if tsx is available locally in target
    let tsxCommand = 'npx tsx';
    try {
      execSync('npx tsx --version', {
        cwd: targetPath,
        stdio: 'pipe'
      });
      console.log(\`✅ tsx disponible localement\`);
    } catch {
      console.log(\`⚠️  tsx non trouvé, installation en cours...\`);

      // Install tsx locally in target directory
      try {
        execSync('yarn add -D tsx', {
          cwd: targetPath,
          stdio: 'inherit'
        });
        console.log(\`✅ tsx installé avec succès\`);
      } catch (installError) {
        console.error(\`❌ Échec de l'installation de tsx:\`, installError.message);
        console.error(\`   Essayez d'installer tsx manuellement: cd "\${targetPath}" && yarn add -D tsx\`);
        process.exit(1);
      }
    }

    // Execute the injection script with tsx
    const command = \`npx tsx "\${injectScriptPath}" "\${targetPath}"\`;

    execSync(command, {
      stdio: 'inherit',
      cwd: targetPath  // Use target directory to ensure tsx is available
    });

    console.log(\`\\n✅ Injection terminée avec succès !\`);

  } catch (error) {
    console.error(\`\\n❌ Erreur lors de l'injection:\`, error.message);
    process.exit(1);
  }
}

// Run the CLI
main();
`;

  fs.writeFileSync(binPath, binContent, "utf8");
  console.log(`   ✅ Generated ${binPath}`);
}

/**
 * Build and publish NPM package - Complete workflow
 */
function buildAndPublishNpm(): void {
  console.log(`🚀 Obsidian Plugin Config - NPM Build & Publish`);
  console.log(`Complete workflow: exports → bin → verify → publish\n`);

  try {
    // Step 1: Update exports automatically
    console.log(`📦 Step 1/4: Updating exports...`);
    execSync('yarn update-exports', { stdio: 'inherit' });

    // Step 2: Generate bin file
    console.log(`\n🔧 Step 2/4: Generating bin/obsidian-inject.js...`);
    generateBinFile();

    // Step 3: Verify package is ready
    console.log(`\n📋 Step 3/4: Verifying package...`);
    verifyPackage();

    // Step 4: Publish to NPM
    console.log(`\n📤 Step 4/4: Publishing to NPM...`);
    execSync('npm publish --registry https://registry.npmjs.org/', { stdio: 'inherit' });

    console.log(`\n🎉 Package published successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. npm install -g obsidian-plugin-config`);
    console.log(`   2. Test injection: cd any-plugin && obsidian-inject`);

  } catch (error) {
    console.error(`\n❌ Build failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Verify package is ready for publication
 */
function verifyPackage(): void {
  // Check required scripts
  const requiredScripts = [
    "scripts/inject-path.ts",
    "scripts/inject-prompt.ts",
    "scripts/utils.ts",
    "scripts/esbuild.config.ts",
    "scripts/acp.ts",
    "scripts/update-version-config.ts",
    "scripts/help.ts"
  ];

  for (const script of requiredScripts) {
    if (!fs.existsSync(script)) {
      throw new Error(`Missing required script: ${script}`);
    }
  }
  console.log(`   ✅ All required scripts present`);

  // Check package.json
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const requiredFields = ['name', 'version', 'description', 'bin', 'repository', 'author'];

  for (const field of requiredFields) {
    if (!packageJson[field]) {
      throw new Error(`Missing required package.json field: ${field}`);
    }
  }
  console.log(`   ✅ Package.json valid (v${packageJson.version})`);

  // Check bin file exists
  if (!fs.existsSync("bin/obsidian-inject.js")) {
    throw new Error(`Missing bin file: bin/obsidian-inject.js`);
  }
  console.log(`   ✅ Bin file ready`);

  // Sync versions.json
  const versionsPath = "versions.json";
  let versions: Record<string, string> = {};

  if (fs.existsSync(versionsPath)) {
    versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));
  }

  if (!versions[packageJson.version]) {
    versions[packageJson.version] = "1.8.9";
    fs.writeFileSync(versionsPath, JSON.stringify(versions, null, "\t"), "utf8");
    console.log(`   ✅ Added version ${packageJson.version} to versions.json`);
  } else {
    console.log(`   ✅ Version ${packageJson.version} in versions.json`);
  }

  // Quick build test
  execSync('yarn build', { stdio: 'pipe' });
  console.log(`   ✅ Build test passed`);
}

// Run the script
buildAndPublishNpm();
