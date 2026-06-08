import { readFile } from 'fs/promises';
import path from 'path';
import {
  askQuestion,
  cleanInput,
  createReadlineInterface,
  gitExec,
  gitOutput,
  ensureGitSync,
  isValidPath
} from './utils.js';

const rl = createReadlineInterface();

/** Check if we're in the centralized config repo */
async function isInCentralizedRepo(): Promise<boolean> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!(await isValidPath(packageJsonPath))) return false;

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  return packageJson.name === 'obsidian-plugin-config';
}

async function main(): Promise<void> {
  try {
    if (process.argv.includes('-b')) {
      console.log('Building...');
      // For obsidian-plugin-config, just run TypeScript check
      if (await isInCentralizedRepo()) {
        gitExec('npx tsc --noEmit');
      } else {
        gitExec('yarn build');
      }
      console.log('Build successful.');
    }

    const input: string = await askQuestion('Enter commit message: ', rl);

    const cleanedInput = cleanInput(input);

    try {
      gitExec('git add -A');
      gitExec(`git commit -m "${cleanedInput}"`);
    } catch {
      console.log('Commit already exists or failed.');
      return;
    }

    // get current branch name
    const currentBranch = gitOutput('git rev-parse --abbrev-ref HEAD');

    // Ensure Git is synchronized before pushing
    await ensureGitSync();

    try {
      gitExec(`git push origin ${currentBranch}`);
      console.log(`Commit and push successful to origin/${currentBranch}`);
    } catch {
      // new branch
      console.log(`New branch detected. Setting upstream for ${currentBranch}...`);
      gitExec(`git push --set-upstream origin ${currentBranch}`);
      console.log('Upstream branch set and push successful.');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('Exiting...');
    process.exit();
  });
