#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

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

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDirExists(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
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

  // Perform copy
  copyRecursive(templateDir, targetDir);

  console.log("\n✔ Project scaffolded successfully!");
  console.log(`→ Location: ${targetDir}`);
  console.log("\nNext steps:");
  console.log("1) cd", targetArg);
  console.log("2) npm install");
  console.log("3) Create .env from example.env and update values");
  console.log("4) npm run dev");
}

main();


