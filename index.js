#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const inquirer = require("inquirer");
const open = require("open");
const { execSync } = require("child_process");
const { OAuth } = require("./github-OAuth");

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

async function createGithubRepo(token, name) {
  try {
    const res = await axios.post(
      "https://api.github.com/user/repos",
      { name },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    console.log(`GitHub repo created: ${res.data.full_name}`);
    return res.data.clone_url;
  } catch (err) {
    if (err.response?.status === 422) {
      console.error(`A repository named "${name}" already exists.`);
    } else {
      console.error("Failed to create repo:", err.response?.data || err.message);
    }
    throw err;
  }
}


function pushGitHub(localPath, remoteUrl) {
  try {
    execSync(`git remote add origin ${remoteUrl}`, { cwd: localPath });
    execSync(`git branch -M main`, { cwd: localPath });
    execSync(`git push -u origin main`, { cwd: localPath, stdio: "inherit" });
    console.log("Pushed to GitHub!");
  } catch (err) {
    console.error("Failed to push to GitHub:", err.message);
  }
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
  const githubToken = process.env.GH_TOKEN || await OAuth(); 
  if (!githubToken) {
    console.error("❌ GitHub token is missing.");
    process.exit(1);
  }
  const remoteUrl = await createGithubRepo(githubToken, folderName);
  pushGitHub(OUTPUT_DIR, remoteUrl);
}

generate();
