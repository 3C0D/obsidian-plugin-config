#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

const TEMPLATES_PKG = "templates/package.json";
const TEMPLATES_SASS = "templates/package-sass.json";

function resolvedVersion(dep: string): string | null {
  const pkgPath = path.join("node_modules", dep, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8")).version as string;
  } catch {
    return null;
  }
}

function updateDeps(deps: Record<string, string>): { updated: string[] } {
  const updated: string[] = [];

  for (const dep of Object.keys(deps)) {
    const current = deps[dep];
    // Skip wildcards like "*"
    if (current === "*") continue;

    const resolved = resolvedVersion(dep);
    if (!resolved) continue;

    // Keep "latest" as-is, update pinned/range versions
    if (current !== "latest") {
      const newVersion = `^${resolved}`;
      if (deps[dep] !== newVersion) {
        deps[dep] = newVersion;
        updated.push(`${dep}: ${current} → ${newVersion}`);
      }
    }
  }

  return { updated };
}

function syncFile(filePath: string): void {
  const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const { updated } = updateDeps(pkg.devDependencies ?? {});

  if (updated.length) {
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(`\n✅ ${filePath}`);
    for (const u of updated) console.log(`   ${u}`);
  } else {
    console.log(`\n✅ ${filePath} — already up to date`);
  }
}

console.log("🔄 Syncing template deps from node_modules...");
syncFile(TEMPLATES_PKG);
syncFile(TEMPLATES_SASS);
console.log("\n✅ Done.");
