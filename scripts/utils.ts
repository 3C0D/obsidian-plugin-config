import { access, mkdir, copyFile, rm } from 'fs/promises';
import path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

export function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin as NodeJS.ReadableStream,
    output: process.stdout as NodeJS.WritableStream
  });
}

export const askQuestion = async (
  question: string,
  rl: readline.Interface
): Promise<string> => {
  try {
    return await new Promise((resolve) =>
      rl.question(question, (input) => resolve(input.trim()))
    );
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
};

/**
 * Ask a yes/no confirmation question with standardized logic
 * Accepts: y, yes, Y, YES, or empty (default to yes)
 * Rejects: n, no, N, NO
 * Invalid input defaults to no for safety
 */
export const askConfirmation = async (
  question: string,
  rl: readline.Interface
): Promise<boolean> => {
  const answer = await askQuestion(`${question} [Y/n]: `, rl);
  const response = answer.toLowerCase();

  // Accept: y, yes, Y, YES, or empty (default to yes)
  // Reject: n, no, N, NO
  const isYes = response === '' || response === 'y' || response === 'yes';
  const isNo = response === 'n' || response === 'no';

  if (isNo) {
    return false;
  } else if (isYes) {
    return true;
  } else {
    console.log('Please answer Y (yes) or n (no). Defaulting to no for safety.');
    return false;
  }
};

export const cleanInput = (inputStr: string): string => {
  if (!inputStr) return '';
  return inputStr.trim().replace(/["`]/g, "'").replace(/\r\n/g, '\n');
};

export const isValidPath = async (pathToCheck: string): Promise<boolean> => {
  if (!pathToCheck) return false;

  try {
    // Using async fs.access is preferred over synchronous existsSync
    // as it doesn't block the main thread/event loop
    await access(pathToCheck.trim());
    return true;
  } catch {
    return false;
  }
};

export async function copyFilesToTargetDir(buildPath: string): Promise<void> {
  const pluginDir = process.cwd();
  const manifestSrc = path.join(pluginDir, 'manifest.json');
  const manifestDest = path.join(buildPath, 'manifest.json');
  const cssDest = path.join(buildPath, 'styles.css');
  const folderToRemove = path.join(buildPath, '_.._');

  try {
    await mkdir(buildPath, { recursive: true });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      console.error(`Error creating directory: ${(error as Error).message}`);
    }
  }

  // Copy manifest
  try {
    await copyFile(manifestSrc, manifestDest);
  } catch (error: unknown) {
    console.error(`Error copying manifest: ${(error as Error).message}`);
  }

  // Copy CSS
  try {
    const srcStylesPath = path.join(pluginDir, 'src/styles.css');
    const rootStylesPath = path.join(pluginDir, 'styles.css');

    // First check if CSS exists in src/styles.css
    if (await isValidPath(srcStylesPath)) {
      await copyFile(srcStylesPath, cssDest);
    }
    // Otherwise, check if it exists in the root
    else if (await isValidPath(rootStylesPath)) {
      await copyFile(rootStylesPath, cssDest);
      if (await isValidPath(folderToRemove)) {
        await rm(folderToRemove, { recursive: true });
      }
    } else {
      return;
    }
  } catch (error: unknown) {
    console.error(`Error copying CSS: ${(error as Error).message}`);
  }
}

/**
 * Execute a shell command.
 * Uses shell spawning for cross-platform compatibility (Windows + Linux).
 * @param pipe - set to true to suppress stdout/stderr output
 */
export function gitExec(command: string, cwd?: string, pipe = false): void {
  try {
    execSync(command, {
      stdio: pipe ? 'pipe' : 'inherit',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
      cwd
    });
  } catch (error: unknown) {
    console.error(`Error executing '${command}':`, (error as Error).message);
    throw error;
  }
}

/**
 * Execute a shell command and return its stdout as a trimmed string.
 * Uses shell spawning for cross-platform compatibility (Windows + Linux).
 */
export function gitOutput(command: string, cwd?: string): string {
  const result = execSync(command, {
    encoding: 'utf8',
    shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    cwd
  });
  return result.trim();
}

/**
 * Ensure Git repository is synchronized with remote before pushing
 */
export async function ensureGitSync(): Promise<void> {
  try {
    console.log('🔄 Checking Git synchronization...');

    // Fetch latest changes from remote
    gitExec('git fetch origin');

    // Check if branch is behind remote
    const status = gitOutput('git status --porcelain -b');

    if (status.includes('behind')) {
      console.log('📥 Branch behind remote. Pulling changes...');
      gitExec('git pull');
      console.log('✅ Successfully pulled remote changes');
    } else {
      console.log('✅ Repository is synchronized with remote');
    }
  } catch (error: unknown) {
    console.error(`❌ Git sync failed: ${(error as Error).message}`);
    throw error;
  }
}
