# Mise à jour du readme auto

vérifier si section ## Development (Add this to your README) ou ## Development
si ## Development (Add this to your README)
- remplacer le contenu de la section par le nouveau contenu
si ## Development 
- ajouter le nouveau contenu à la suite du contenu existant
On va évidemment générer ce nouveau contenu en fonction du projet actuel.


voici un ancien exemple à mettre à jour:
## Development (Add this to your README)

Automate the development and publication processes on github, including releases. You are supposed to git clone your plugin out of the vault and set the right path in the .env file (1 for your trying vault, 1 for the real vault).  
  
If you want more options like sass, check out other branches     
  
### Environment Setup
  
- **Development in the plugins folder of your vault:**
  - Set the `REAL` variable to `-1` in the `.env` file. Or delete the file. Run the usual npm commands.

- **Development outside the vault:**
  - If your plugin's source code is outside the vault, the necessary files will be automatically copied to the targeted vault. Set the paths in the .env file. Use TestVault for the development vault and RealVault to simulate production.  
  
- **other steps:**   
  - You can then do `npm run version` to update the version and do the push of the changed files (package, manifest, version). Prompts will guide you.  
  
  - You can then do `npm run release` to create the release. Few seconds later you can see the created release in the GitHub releases.  

### Available Commands
  
*I recommend a `npm run start` then `npm run bacp` then `npm run version` then `npm run release`. Super fast and easy.*  
  
- **`npm run dev` and `npm start`**: For development. 
  `npm start` opens Visual Studio Code, runs `npm install`, and then `npm run dev`  
  
- **`npm run build`**: Builds the project in the folder containing the source code.  
  
- **`npm run real`**: Equivalent to a traditional installation of the plugin in your REAL vault.  
  
- **`npm run bacp`** & **`npm run acp`**: `b` stands for build, and `acp` stands for add, commit, push. You will be prompted for the commit message. 
  
- **`npm run version`**: Asks for the type of version update, modifies the relevant files, and then performs an add, commit, push.  
  
- **`npm run release`**: Asks for the release title, creates the release. This command works with the configurations in the `.github` folder. The release title can be multiline by using `\n`.

--- fin

Autre chose Ajouter `yarn upgrade` au readme pour les mises à jour libs.

# exemple config dernier plugin réalisé ok

je vais ajouter des configs qui sont ok Vérifiez avec ce qu'il y a dans Templates pour mettre à jour

ts-config

```json
{
  "compilerOptions": {
    "types": ["obsidian-typings"],
    "paths": {
      "obsidian-typings/implementations": [
        "./node_modules/obsidian-typings/dist/cjs/implementations.d.cts",
        "./node_modules/obsidian-typings/dist/esm/implementations.mjs"
      ]
    },
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2021",
    "inlineSourceMap": true,
    "inlineSources": true,
    "allowJs": true,
    "noImplicitAny": true,
    "importHelpers": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "strictNullChecks": true,
    "resolveJsonModule": true,
    "lib": ["DOM", "ES2021"]
  },
  "include": ["./src/**/*.ts", "./scripts/**/*.ts"],
  "exclude": ["node_modules", "eslint.config.ts", "templates"]
}
```


package
```json
{
  "name": "obsidian-code-files-modif",
  "version": "1.0.0",
  "description": "Code Files Modif",
  "type": "module",
  "main": "src/index.ts",
  "license": "MIT",
  "keywords": [
    "obsidian",
    "obsidian-plugin",
    "typescript"
  ],
  "scripts": {
    "start": "yarn install && yarn dev",
    "dev": "tsx scripts/esbuild.config.ts",
    "build": "tsc -noEmit -skipLibCheck && tsx scripts/esbuild.config.ts production",
    "real": "tsx scripts/esbuild.config.ts production real",
    "acp": "tsx scripts/acp.ts",
    "bacp": "tsx scripts/acp.ts -b",
    "v": "tsx scripts/update-version.ts",
    "r": "tsx scripts/release.ts",
    "h": "tsx scripts/help.ts",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "prettier": "prettier --check '**/*.{ts,json}'",
    "prettier:fix": "prettier --write '**/*.{ts,json}'"
  },
  "devDependencies": {
    "@types/eslint": "latest",
    "@types/node": "latest",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "builtin-modules": "latest",
    "dedent": "latest",
    "dotenv": "latest",
    "esbuild": "latest",
    "eslint": "latest",
    "eslint-import-resolver-typescript": "latest",
    "jiti": "latest",
    "obsidian": "*",
    "obsidian-typings": "latest",
    "prettier": "^3.8.1",
    "tslib": "2.4.0",
    "tsx": "^4.21.0",
    "typescript": "^5.8.2"
  },
  "dependencies": {
  },
  "engines": {
    "npm": "please-use-yarn",
    "yarn": ">=1.22.0",
    "node": ">=16.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/3C0D/obsidian-plugin-config.git"
  },
  "author": "3C0D"
}
```

Bon, normalement j'ai laissé que les bibliothèques utiles Si je me suis pas trompé, mais bon tu verras Si y a des différences ou si y a des trucs à ajouter. Avec discernement bien sûr

eslint.config.mts
```ts
import * as typescriptEslintParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import "eslint-import-resolver-typescript";
import type {
  Linter
} from "eslint";

const configs: Linter.Config[] = [
  {
    ignores: ["eslint.config.mts", "templates/**"]
  },
  {
    files: ["**/*.ts"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "main.js"
    ],
    languageOptions: {
      parser: typescriptEslintParser,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: 2023
      }
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin as any // Type assertion to bypass type checking
    },
    rules: {
      // Base rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "args": "none", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-prototype-builtins": "off",
      "@typescript-eslint/no-empty-function": "off",

      // Useful rules but not too strict
      "semi": "error",
      "eqeqeq": ["error", "always"],
      "prefer-const": "error",
      "@typescript-eslint/explicit-function-return-type": ["warn", { "allowExpressions": true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["warn", { "prefer": "type-imports" }],

      // Disable overly strict rules
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off"
    }
  }
];

export default configs;

```

.pettrierrc
```json
{
	"useTabs": true,
	"tabWidth": 4,
	"printWidth": 90,
	"endOfLine": "lf",
	"trailingComma": "none",
	"semi": true,
	"singleQuote": true,
	"arrowParens": "always",
	"overrides": [
		{
			"files": ["*.json"],
			"options": {
				"useTabs": false,
				"tabWidth": 2
			}
		}
	]
}
```

.prettierignore
```py
# Build output
dist/
main.js

# Dependencies
node_modules/
```

.gitattributes
```py
# On Windows, git defaults to core.autocrlf=true which converts LF to CRLF and creates false modifications
* text=auto eol=lf
*.ts text eol=lf
*.json text eol=lf
```

editorconfig
```py
# top-most EditorConfig file
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = tab
indent_size = 4
tab_width = 4

[*.json]
indent_style = space
indent_size = 2
```

dans package:
En fait, d'après ce que je sais, c'est une extension vsc que j'ai activée. Donc il faudrait dire dans les extensions de suggéré de l'installer. Sinon, peut-être que il y a directement un module dans package?

dans docs j'ai mis le esbuild.config.ts De ce même autre plugin Le truc c'est que la logique pour SASS a été retirée parce que il y en avait pas besoin. Par contre, la logique par rapport au fait que si on est en train de faire Un développement extérieur ou in place A été amélioré. Du coup, le fichier Utils.ts A été joint parce que peut-être que y a eu aussi des modifications Si tu as besoin d'autres fichiers, tu me le dis Normalement, les autres scripts n'ont pas été touchés.

En fait, il faut bien comprendre que je viens de faire un autre plugin et que j'ai retouché plusieurs choses par rapport au Template initial Donc je te donne un peu l'actualité pour que tu puisses améliorer le template 

dans .vscode/settings
```json
{
  "npm.packageManager": "yarn",
  // "js/ts.preferences.includePackageJsonAutoImports": "off",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "yzhang.markdown-all-in-one"
  },
  "editor.formatOnSave": true,
}
```

Là peut-être suggérer d'utiliser. Editor Config. Sauf si Une extension a été installée dans package bien sûr.

tasks.json
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Lint",
      "type": "shell",
      "command": "yarn lint",
      "group": "test",
      "presentation": { "reveal": "always", "panel": "shared" },
      "problemMatcher": ["$eslint-stylish"]
    },
    {
      "label": "Lint: Fix",
      "type": "shell",
      "command": "yarn lint:fix",
      "group": "test",
      "presentation": { "reveal": "always", "panel": "shared" },
      "problemMatcher": ["$eslint-stylish"]
    },
    {
      "label": "Prettier: Check",
      "type": "shell",
      "command": "yarn prettier",
      "group": "test",
      "presentation": { "reveal": "always", "panel": "shared" },
      "problemMatcher": []
    },
    {
      "label": "Prettier: Fix",
      "type": "shell",
      "command": "yarn prettier:fix",
      "group": "test",
      "presentation": { "reveal": "always", "panel": "shared" },
      "problemMatcher": []
    },
    {
      "label": "Build",
      "type": "shell",
      "command": "yarn build",
      "group": { "kind": "build", "isDefault": true },
      "presentation": { "reveal": "always", "panel": "shared" },
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "Obsidian Inject",
      "type": "shell",
      "command": "obsidian-inject",
      "group": "build",
      "presentation": { "reveal": "always", "panel": "shared" },
      "problemMatcher": []
    },
    {
      "label": "Cleanup: Lint + Prettier + Build",
      "dependsOrder": "sequence",
      "dependsOn": ["Lint: Fix", "Prettier: Fix", "Build"],
      "group": "build",
      "presentation": { "reveal": "always", "panel": "shared" },
      "problemMatcher": []
    }
  ]
}
```

.github/workflows/release
````yaml
name: Release Obsidian Plugin

on:
  push:
    tags:
      - "*"

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22.x"

      # Setup Yarn
      - name: Setup Yarn
        run: |
          corepack enable
          yarn --version

      # Build the plugin
      - name: Build
        id: build
        run: |
          yarn install
          yarn build

      # Package all necessary files into a zip
      - name: Package release files
        run: |
          mkdir release-package
          cp manifest.json main.js styles.css monacoEditor.html monacoHtml.js monacoHtml.css release-package/
          cp -r vs monaco-themes formatters release-package/
          cd release-package && zip -r ../obsidian-code-files-modif.zip .

      # Create the release on GitHub
      - name: Create Release
        id: create_release
        uses: ncipollo/release-action@v1.13.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VERSION: ${{ github.ref }}
        with:
          allowUpdates: true
          generateReleaseNotes: true
          artifactErrorsFailBuild: false
          makeLatest: true
          artifacts: "manifest.json,main.js,styles.css,obsidian-code-files-modif.zip"
          bodyFile: ".github/workflows/release-body.md"
```

# Bon ça je pense que ça a été fait. J'avais noté ça dans mes notes:
- ajouter command format all `prettier --write` installer `yarn add -D prettier`

- lancer un yarn install après injection?

- Ah oui, j'avais eu un problème avec la configuration, c'est qu'ils n'installaient pas obsidian-typing latest. Mais bon, je t'ai donné un package qui marchait au dessus.
npx(pas besoin) prettier → yarn exec prettier pour résoudre le problème de PATH sur Windows

@types/lodash et lodash sont en dependencies — @types/lodash devrait être en devDependencies (c'est uniquement des types TypeScript, rien de runtime). Et lodash lui-même, est-ce qu'il est vraiment utilisé dans le plugin ? Parce que si c'est juste pour les scripts de build, il devrait aussi être en -D.


