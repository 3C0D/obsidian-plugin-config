#!/usr/bin/env node

/**
 * Obsidian Plugin Config - CLI Entry Point
 * Global command: obsidian-inject
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = dirname(__dirname);

// Path to the injection script
const injectScriptPath = join(packageRoot, 'scripts', 'inject-path.ts');

function showHelp() {
  console.log(`
Obsidian Plugin Config - Global CLI
Système d'injection pour plugins Obsidian autonomes

UTILISATION:
  obsidian-inject                    # Injection dans le répertoire courant
  obsidian-inject <chemin>           # Injection par chemin
  obsidian-inject --help, -h         # Afficher cette aide

EXEMPLES:
  cd mon-plugin && obsidian-inject
  obsidian-inject ../mon-autre-plugin
  obsidian-inject "C:\\Users\\dev\\plugins\\mon-plugin"

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
`);
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
    console.error(`❌ Erreur: Script d'injection non trouvé à ${injectScriptPath}`);
    console.error(`   Vérifiez que obsidian-plugin-config est correctement installé.`);
    process.exit(1);
  }

  // Determine target path
  let targetPath = args[0] || process.cwd();
  
  console.log(`🎯 Obsidian Plugin Config - Injection Globale`);
  console.log(`📁 Cible: ${targetPath}`);
  console.log(`📦 Depuis: ${packageRoot}\n`);

  try {
    // Execute the injection script with tsx
    const command = `npx tsx "${injectScriptPath}" "${targetPath}"`;
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: packageRoot
    });
    
    console.log(`\n✅ Injection terminée avec succès !`);
    
  } catch (error) {
    console.error(`\n❌ Erreur lors de l'injection:`, error.message);
    process.exit(1);
  }
}

// Run the CLI
main();
