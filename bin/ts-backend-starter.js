#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

function printUsage() {
  console.log(
    "Usage: npx ts-backend-starter [target-directory]\n\n" +
      "- If target-directory is omitted, current directory is used.\n" +
      "- The command will copy the template/ into the target directory.\n"
  );
}

function exitWithError(message) {
  console.error("Error:", message);
  process.exit(1);
}

function isDirEmpty(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    return items.length === 0;
  } catch (err) {
    return true;
  }
}

function ensureDirExists(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(src, dest, options = {}) {
  const { shouldIgnore } = options;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDirExists(dest);
    for (const entry of fs.readdirSync(src)) {
      const srcEntry = path.join(src, entry);
      const destEntry = path.join(dest, entry);
      if (shouldIgnore && shouldIgnore(srcEntry)) continue;
      copyRecursive(srcEntry, destEntry, options);
    }
  } else {
    if (shouldIgnore && shouldIgnore(src)) return;
    ensureDirExists(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printUsage();
    process.exit(0);
  }

  const targetArg = args[0] || ".";
  const targetDir = path.resolve(process.cwd(), targetArg);

  // Resolve path to template bundled with this package
  const packageRoot = path.resolve(__dirname, "..");
  const templateDir = path.join(packageRoot, "template");

  if (!fs.existsSync(templateDir)) {
    exitWithError("Template directory not found in package.");
  }

  // Create target directory if it doesn't exist
  ensureDirExists(targetDir);

  // Safety: If target directory is not empty, abort to prevent accidental overwrite
  if (!isDirEmpty(targetDir)) {
    exitWithError(
      `Target directory is not empty: ${targetDir}. Please specify an empty directory or a new name.`
    );
  }

  // Prepare ignore logic: skip template root package.json (we will generate a new one)
  const templateRootPackageJsonPath = path.join(templateDir, "package.json");
  const shouldIgnore = (absSrcPath) => absSrcPath === templateRootPackageJsonPath;

  // Perform copy, excluding template/package.json
  copyRecursive(templateDir, targetDir, { shouldIgnore });

  // Build package.json for the new project
  let projectName = path.basename(targetDir);
  try {
    const templatePkgRaw = fs.readFileSync(templateRootPackageJsonPath, "utf8");
    const templatePkg = JSON.parse(templatePkgRaw);
    const newPkg = {
      ...templatePkg,
      name: projectName,
      description: "Backend project built using ts-backend-starter",
    };
    const output = JSON.stringify(newPkg, null, 2) + "\n";
    fs.writeFileSync(path.join(targetDir, "package.json"), output, "utf8");
  } catch (err) {
    exitWithError("Failed to generate package.json: " + err.message);
  }

  console.log("\n✔ Project setup done successfully!");
  console.log(`→ Location: ${targetDir}`);
  console.log("\nInstalling dependencies (this may take a minute)...");
  try {
    execSync("npm install", { cwd: targetDir, stdio: "inherit" });
  } catch (err) {
    console.error("\nDependency installation failed. You can run 'npm install' manually.");
  }

  console.log("\nCreate .env from example.env and update values as needed.");

  // Prompt to run dev server
  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("\nDo you want to start the dev server now? (y/N) ", (answer) => {
    rl.close();
    const yes = typeof answer === "string" && answer.trim().toLowerCase().startsWith("y");
    if (!yes) {
      console.log("\nAll set! To start later:");
      console.log(`cd ${targetArg}`);
      console.log("npm run dev");
      process.exit(0);
    }

    console.log("\nStarting dev server...\n");
    // Use shell to be robust across Windows (cmd, PowerShell, Git Bash) and POSIX shells
    const child = spawn("npm", ["run", "dev"], {
      cwd: targetDir,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => {
      process.exit(code ?? 0);
    });
  });
}

main();


