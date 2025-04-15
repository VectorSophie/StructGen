#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const inquirer = require("inquirer"); 

async function promptUser() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "folderName",
      message: "Enter the folder name:",
      default: "generated_files", 
    },
    {
      type: "input",
      name: "fileExtension",
      message: "Enter the file format (e.g., .py, .ts, .sql):",
      default: ".py", 
    },
    {
      type: "number",
      name: "numFiles",
      message: "How many files do you want to generate in each subfolder?",
      default: 10,
    },
    {
      type: "input",
      name: "subfolders",
      message: "Enter subfolder names (comma separated):",
      default: "subfolder1,subfolder2,subfolder3",
    },
  ]);
  return answers;
}

async function generate() {
  const { folderName, fileExtension, numFiles, subfolders } = await promptUser();
  const OUTPUT_DIR = path.join(process.cwd(), folderName);

  await fs.ensureDir(OUTPUT_DIR);

  const subfolderNames = subfolders.split(",").map(name => name.trim());

  for (const subfolderName of subfolderNames) {
    const subfolderPath = path.join(OUTPUT_DIR, subfolderName);

    await fs.ensureDir(subfolderPath);

    for (let fileIndex = 1; fileIndex <= numFiles; fileIndex++) {
      const filename = `${String(fileIndex).padStart(2, "0")}${fileExtension}`;
      const filePath = path.join(subfolderPath, filename);
      const contents = `# ${filename}\n\nconsole.log("This is ${filename} in ${subfolderName}");\n`; 
      await fs.writeFile(filePath, contents);
    }
  }

  try {
    execSync("git init", { cwd: OUTPUT_DIR, stdio: "inherit" });
    execSync("git add .", { cwd: OUTPUT_DIR });
    execSync(`git commit -m "Initial commit for ${folderName}"`, { cwd: OUTPUT_DIR });
    console.log(`Git repository initialized as "${folderName}".`);
  } catch (err) {
    console.error("Git initialization failed:", err.message);
  }

  console.log(`Generated ${numFiles * subfolderNames.length} ${fileExtension} files across ${subfolderNames.length} subfolders in ${OUTPUT_DIR}`);
}

generate();
