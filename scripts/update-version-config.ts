import { readFile, writeFile } from "fs/promises";
import dedent from "dedent";
import { inc, valid } from "semver";
import { createReadlineInterface, askQuestion, gitExec } from "./utils.js";


const rl = createReadlineInterface();

async function getTargetVersion(currentVersion: string): Promise<string> {
    const updateType = await askQuestion(dedent`
        Current version: ${currentVersion}
        Kind of update:
            patch(1.0.1) -> type 1 or p
            minor(1.1.0) -> type 2 or min
            major(2.0.0) -> type 3 or maj
            or version number (e.g. 2.0.0)
        Enter choice: `, rl);

    switch (updateType.trim()) {
        case "p":
        case "1":
            return inc(currentVersion, "patch") || "";
        case "min":
        case "2":
            return inc(currentVersion, "minor") || "";
        case "maj":
        case "3":
            return inc(currentVersion, "major") || "";
        default:
            return valid(updateType.trim()) || "";
    }
}

async function updateJsonFile(filename: string, updateFn: (json: any) => void): Promise<void> {
    try {
        const content = JSON.parse(await readFile(filename, "utf8"));
        updateFn(content);
        await writeFile(filename, JSON.stringify(content, null, "\t"));
    } catch (error) {
        console.error(`Error updating ${filename}:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
}

async function updateConfigVersions(targetVersion: string): Promise<void> {
    try {
        await Promise.all([
            updateJsonFile("package.json", json => json.version = targetVersion),
            updateJsonFile("versions.json", json => json[targetVersion] = "1.8.9")
        ]);
    } catch (error) {
        console.error("Error updating config versions:", error instanceof Error ? error.message : String(error));
        throw error;
    }
}

async function updateVersion(): Promise<void> {
    try {
        const currentVersion = process.env.npm_package_version || "1.0.0";
        const targetVersion = await getTargetVersion(currentVersion);

        if (!targetVersion) {
            console.log("Invalid version");
            return;
        }

        try {
            // Update all files first
            await updateConfigVersions(targetVersion);
            console.log(`Files updated to version ${targetVersion}`);

            // Add files to git
            gitExec("git add package.json versions.json");
            gitExec(`git commit -m "Updated to version ${targetVersion}"`);
            console.log("Changes committed");
        } catch (error) {
            console.error("Error during update or commit:", error instanceof Error ? error.message : String(error));
            console.log("Operation failed.");
            return;
        }

        try {
            gitExec("git push");
            console.log(`Version successfully updated to ${targetVersion} and pushed.`);
        } catch (pushError) {
            console.error("Failed to push version update:", pushError instanceof Error ? pushError.message : String(pushError));
        }
    } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : String(error));
    } finally {
        rl.close();
    }
}

updateVersion().catch(console.error).finally(() => {
    console.log("Exiting...");
    process.exit();
});