# Windows node_modules Cleanup Problem

## Issue
Injection fails on Windows with EPERM error when Yarn tries to install dependencies:
```
error Error: EPERM: operation not permitted, unlink 'C:\...\node_modules\@esbuild\win32-x64\esbuild.exe'
```

## Root Cause
1. Script reports "🗑️ Removed node_modules" but `rmdir /s /q` fails silently on locked .exe files
2. node_modules remains partially present with corrupted/locked files
3. Yarn tries to reuse this corrupted node_modules and fails

## Current Code (inject-core.ts, ~line 680)
```typescript
if (fs.existsSync(nodeModulesPath)) {
    console.log(`   ⏳ Removing node_modules (this may take a moment)...`);
    try {
        execSync(`rmdir /s /q "${nodeModulesPath}"`, {
            stdio: 'pipe',
            windowsHide: true
        });
        console.log(`   🗑️  Removed node_modules (will be reinstalled with Yarn)`);
    } catch {
        // Rename fallback - BUT THIS NEVER EXECUTES because rmdir doesn't throw!
        try {
            const timestamp = Date.now();
            const oldPath = `${nodeModulesPath}.old.${timestamp}`;
            fs.renameSync(nodeModulesPath, oldPath);
            console.log(`   🔄 Renamed locked node_modules to ${path.basename(oldPath)}`);
        } catch {
            console.log(`   ⚠️  Could not remove/rename node_modules`);
            throw new Error('node_modules locked - close processes and retry');
        }
    }
}
```

## Problem
`execSync('rmdir /s /q ...')` with `stdio: 'pipe'` does NOT throw an exception when it fails to delete locked files. It exits with code 0 even though files remain.

## Required Fix
After `rmdir` command, CHECK if node_modules still exists. If yes, execute the rename fallback:

```typescript
if (fs.existsSync(nodeModulesPath)) {
    console.log(`   ⏳ Removing node_modules (this may take a moment)...`);
    
    // Try to remove
    execSync(`rmdir /s /q "${nodeModulesPath}"`, {
        stdio: 'pipe',
        windowsHide: true
    });
    
    // CHECK if it actually worked
    if (fs.existsSync(nodeModulesPath)) {
        // rmdir failed silently - rename instead
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
```

## File to Fix
`scripts/inject-core.ts` - function `cleanNpmArtifactsIfNeeded` (around line 680-730)

## Test Case
User runs `obsidian-inject` while VSCode is open on the plugin directory. The esbuild.exe file is locked by VSCode's TypeScript server.

Expected: node_modules gets renamed to node_modules.old.{timestamp}, Yarn creates fresh node_modules
Actual: rmdir fails silently, Yarn tries to use corrupted node_modules, EPERM error
