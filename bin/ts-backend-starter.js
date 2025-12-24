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

function promptForDatabase(callback) {
  const readline = require("readline");
  const options = [
    { name: "MongoDB (with Mongoose)", value: "mongodb" },
    { name: "PostgreSQL (with Prisma)", value: "postgresql" },
  ];
  let selectedIndex = 0;

  console.log("\nChoose your database:");
  console.log("Use ↑/↓ arrow keys to select, press Enter to confirm\n");

  function render() {
    // Clear previous render (move cursor up and clear lines)
    if (selectedIndex > 0 || process.stdout.isTTY) {
      process.stdout.write("\x1b[2K\r"); // Clear current line
      for (let i = 0; i < options.length; i++) {
        process.stdout.write("\x1b[1A\x1b[2K"); // Move up and clear
      }
    }

    options.forEach((option, index) => {
      const prefix = index === selectedIndex ? "❯ " : "  ";
      const style = index === selectedIndex ? "\x1b[36m\x1b[1m" : "\x1b[0m"; // Cyan + bold
      const reset = "\x1b[0m";
      console.log(`${style}${prefix}${option.name}${reset}`);
    });
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  readline.emitKeypressEvents(process.stdin, rl);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  render();

  process.stdin.on("keypress", (str, key) => {
    if (key.name === "return" || key.name === "enter") {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      rl.close();
      console.log(); // Newline after selection
      callback(options[selectedIndex].value);
    } else if (key.name === "up" && selectedIndex > 0) {
      selectedIndex--;
      render();
    } else if (key.name === "down" && selectedIndex < options.length - 1) {
      selectedIndex++;
      render();
    } else if (key.ctrl && key.name === "c") {
      process.exit(0);
    }
  });
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

  // Prompt for database choice
  promptForDatabase((dbChoice) => {
    const useMongoDB = dbChoice === "mongodb";
    const usePostgreSQL = dbChoice === "postgresql";

    // Prepare ignore logic: skip template root package.json (we will generate a new one)
    // Also skip database folder if PostgreSQL is chosen
    const templateRootPackageJsonPath = path.join(templateDir, "package.json");
    const databaseFolderPath = path.join(templateDir, "database");
    const shouldIgnore = (absSrcPath) => {
      if (absSrcPath === templateRootPackageJsonPath) return true;
      if (usePostgreSQL && absSrcPath === databaseFolderPath) return true;
      return false;
    };

    // Perform copy
    copyRecursive(templateDir, targetDir, { shouldIgnore });

    // Build package.json for the new project with appropriate dependencies
    let projectName = path.basename(targetDir);
    try {
      const templatePkgRaw = fs.readFileSync(templateRootPackageJsonPath, "utf8");
      const templatePkg = JSON.parse(templatePkgRaw);
      
      let devDependencies = { ...templatePkg.devDependencies };
      let dependencies = { ...templatePkg.dependencies };

      if (usePostgreSQL) {
        // Remove MongoDB-related dependencies
        delete devDependencies["@types/mongoose"];
        delete dependencies["mongoose"];
        
        // Add Prisma dependencies
        devDependencies["prisma"] = "^6.2.0";
        dependencies["@prisma/client"] = "^6.2.0";
      }

      const newPkg = {
        ...templatePkg,
        name: projectName,
        description: "Backend project built using ts-backend-starter",
        devDependencies,
        dependencies,
      };
      const output = JSON.stringify(newPkg, null, 2) + "\n";
      fs.writeFileSync(path.join(targetDir, "package.json"), output, "utf8");
    } catch (err) {
      exitWithError("Failed to generate package.json: " + err.message);
    }

    console.log("\n✔ Project setup done successfully!");
    console.log(`→ Location: ${targetDir}`);
    console.log(`→ Database: ${useMongoDB ? "MongoDB (Mongoose)" : "PostgreSQL (Prisma)"}`);
    console.log("\nInstalling dependencies (this may take a minute)...");
    try {
      execSync("npm install", { cwd: targetDir, stdio: "inherit" });
    } catch (err) {
      console.error("\nDependency installation failed. You can run 'npm install' manually.");
    }

    // Run prisma init for PostgreSQL setup
    if (usePostgreSQL) {
      console.log("\nInitializing Prisma...");
      try {
        execSync("npx prisma init", { cwd: targetDir, stdio: "inherit" });
        console.log("\n✔ Prisma initialized! Edit prisma/schema.prisma to define your models.");
      } catch (err) {
        console.error("\nPrisma initialization failed. You can run 'npx prisma init' manually.");
      }
    }

    console.log("\nCreate .env from example.env and update values as needed.");
    if (usePostgreSQL) {
      console.log("Update DATABASE_URL in .env with your PostgreSQL connection string.");
    }

    // Prompt to run dev server
    const readline = require("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("\nDo you want to start the dev server now? (y/N) ", (answer) => {
      rl.close();
      const yes = typeof answer === "string" && answer.trim().toLowerCase().startsWith("y");
      if (!yes) {
        console.log("\nAll set! To start later:");
        console.log(`cd ${targetArg}`);
        if (usePostgreSQL) {
          console.log("npx prisma migrate dev --name init  # Create your first migration");
          console.log("npx prisma generate  # Generate Prisma client");
        }
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
  });
}

main();


