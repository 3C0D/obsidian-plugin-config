import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Scans the src directory for subdirectories with index.ts files
 * and generates the main index.ts with appropriate exports
 */
function updateExports() {
  console.log('🔄 Updating exports...');

  const srcDir = path.join(__dirname, '../src');
  const mainIndexPath = path.join(srcDir, 'index.ts');

  try {
    // Check if src directory exists
    if (!fs.existsSync(srcDir)) {
      console.error('❌ src directory not found');
      return;
    }

    // Get all subdirectories in src/
    const items = fs.readdirSync(srcDir, { withFileTypes: true });
    const subdirs = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    // Find subdirectories that have an index.ts file
    const exportsToGenerate = [];

    for (const subdir of subdirs) {
      const subdirPath = path.join(srcDir, subdir);
      const indexPath = path.join(subdirPath, 'index.ts');

      if (fs.existsSync(indexPath)) {
        exportsToGenerate.push(subdir);
        console.log(`✅ Found exportable module: ${subdir}`);
      }
    }

    // Generate the export statements
    const exportStatements = exportsToGenerate
      .map(subdir => `export * from './${subdir}/index.js';`)
      .join('\n');

    // Add header comment
    const fileContent = `// Auto-generated exports - DO NOT EDIT MANUALLY
// Run 'npm run update-exports' to regenerate this file

${exportStatements}
`;

    // Write the main index.ts file
    fs.writeFileSync(mainIndexPath, fileContent, 'utf8');

    // Update package.json exports
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Generate exports object
    const exportsObj = {
      ".": "./src/index.ts",
      "./scripts/*": "./scripts/*"
    };

    // Add exports for each module
    for (const subdir of exportsToGenerate) {
      exportsObj[`./${subdir}`] = `./src/${subdir}/index.ts`;
    }

    packageJson.exports = exportsObj;

    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

    console.log(`✅ Updated ${mainIndexPath}`);
    console.log(`✅ Updated ${packageJsonPath} exports`);
    console.log(`📦 Generated ${exportsToGenerate.length} export(s): ${exportsToGenerate.join(', ')}`);

  } catch (error) {
    console.error('❌ Error updating exports:', error.message);
    process.exit(1);
  }
}

// Run the function
updateExports();
