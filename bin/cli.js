#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import inquirer from "inquirer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, "..");

const exclusions = ["node_modules", "bin", ".git", ".astro"]; // Add any additional directories you want to exclude here

function uninstallInquirer() {
	console.log("Uninstalling inquirer...");
	execSync("pnpm remove inquirer", {
		stdio: "inherit",
	});
}

function deleteDirectoryRecursive(directoryPath) {
	if (fs.existsSync(directoryPath)) {
		fs.readdirSync(directoryPath).forEach((file, index) => {
			const curPath = path.join(directoryPath, file);
			if (fs.lstatSync(curPath).isDirectory()) {
				// Recursive delete if it's a directory
				deleteDirectoryRecursive(curPath);
			} else {
				// Delete the file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(directoryPath); // Remove the directory itself
	}
}

function isCommandAvailable(command) {
	try {
		execSync(command, { stdio: "ignore" });
		return true;
	} catch (error) {
		return false;
	}
}

function copyRecursive(src, dest) {
	const exists = fs.existsSync(src);
	const stats = exists && fs.statSync(src);
	const isDirectory = exists && stats.isDirectory();
	const isExcluded = exclusions.includes(path.basename(src));

	if (isExcluded) return;

	if (isDirectory) {
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest);
		}

		fs.readdirSync(src).forEach((child) => {
			copyRecursive(path.join(src, child), path.join(dest, child));
		});
	} else {
		fs.copyFileSync(src, dest);
	}
}

function getGitAuthorName() {
	try {
		const name = execSync("git config user.name", { encoding: "utf8" }).trim();
		return name;
	} catch (error) {
		console.warn("Failed to get git user name:", error.message);
		return "your name"; // or a default value
	}
}

function ensureNetlifyCLI() {
	// We assume that if `pnpm list -g netlify-cli` command doesn't throw an error, then netlify-cli is installed.
	if (!isCommandAvailable("pnpm list -g netlify-cli")) {
		console.log("netlify-cli is not installed. Installing using pnpm...");
		execSync("pnpm add -g netlify-cli", { stdio: "inherit" });
		console.log("netlify-cli installed successfully.");
	} else {
		console.log("netlify-cli is already installed.");
	}
}

function generateNetlifyToml(destination) {
	const tomlContent = `
[build]
  publish = "public/"
  command = "pnpm run build"
`;

	const tomlPath = path.join(destination, "netlify.toml");
	fs.writeFileSync(tomlPath, tomlContent.trim() + "\n");
	console.log(`Generated 'netlify.toml' at ${tomlPath}`);
}

function ensureGHCLI() {
	if (!isCommandAvailable("gh --version")) {
		console.warn("GitHub CLI (gh) is not installed but is required for certain operations.");
		console.warn("Please visit 'https://github.com/cli/cli#installation' to install the GitHub CLI.");
		process.exit(1); // Terminate the program.
	} else {
		console.log("GitHub CLI (gh) is already installed.");
	}
}

function isGitRepo() {
	try {
		execSync("git status", { stdio: "ignore" });
		return true;
	} catch (error) {
		return false;
	}
}

function createGitHubRepo(repoName) {
	try {
		execSync(`gh repo create ${repoName} --confirm`, { stdio: "inherit" });
	} catch (error) {
		console.error("Failed to create the repo:", error.message);
	}
}

function isRepoConnectedToGitHub() {
	try {
		const remoteURL = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
		return remoteURL.includes("github.com");
	} catch (error) {
		return false;
	}
}

function pushToGitHub() {
	try {
		execSync("git push -u origin main", { stdio: "inherit" }); // assuming you're pushing the main branch
	} catch (error) {
		console.error("Failed to push to GitHub:", error.message);
	}
}

async function ensureConnectedToGitHub(destination) {
	// Check if the directory is a Git repo
	if (!isGitRepo()) {
		console.error("This directory is not a Git repository. Initializing it as one.");
		execSync("git init", { stdio: "inherit" });
	}

	// Check if the repo is connected to GitHub
	if (!isRepoConnectedToGitHub()) {
		console.log("This repository is not connected to GitHub.");

		if (!isCommandAvailable("gh")) {
			const choices = await inquirer.prompt([
				{
					type: "list",
					name: "action",
					message: "GitHub CLI (gh) is not installed but is required for certain operations. What would you like to do?",
					choices: [
						{ name: "Exit the CLI", value: "exit" },
						{ name: "Continue without attaching the repo to GitHub", value: "continue" },
					],
				},
			]);

			if (choices.action === "exit") {
				console.log("Exiting CLI. Please install GitHub CLI and run again.");
				process.exit(0);
			}
			// If user chooses to continue, the function will just end and won't push changes to GitHub
			return false;
		}

		// If GitHub CLI is installed, then continue with the process
		createGitHubRepo(path.basename(destination)); // Create a new GitHub repo with the name of the destination directory
		execSync("git add .", { stdio: "inherit" }); // Stage all files
		execSync('git commit -m "Initial commit"', { stdio: "inherit" }); // Commit changes
		pushToGitHub(); // Push changes to the new GitHub repo
		return true;
	}
	return true; // This handles the case where the repo is already connected to GitHub
}

async function deployToNetlify(destination) {
	console.log("Deploying to Netlify...");

	generateNetlifyToml(destination);

	// Change directory to destination
	process.chdir(destination);

	// Remove the functions folder
	const functionsDir = path.join(destination, "functions");
	deleteDirectoryRecursive(functionsDir);
	console.log(`Removed 'functions' directory from ${destination} as is only needed for cloudflare pages.`);

	// Ensure that netlify-cli is installed
	ensureNetlifyCLI();

	// Ensure the directory is connected to GitHub
	const isGitHubConnected = await ensureConnectedToGitHub(destination); // This function now might return a boolean value.

	// Check the GitHub connection status and decide the deployment strategy
	if (isGitHubConnected) {
		// Connected to GitHub, so setup continuous deployment
		try {
			execSync("netlify init", { stdio: "inherit" });
			console.log("Continuous deployment to Netlify set up successfully.");
		} catch (error) {
			console.error("Failed to set up continuous deployment to Netlify:", error.message);
		}
	} else {
		// Not connected to GitHub, do a manual deploy
		try {
			execSync("netlify deploy --prod", { stdio: "inherit" });
			console.log("Deployment to Netlify completed successfully.");
		} catch (error) {
			console.error("Failed to deploy to Netlify:", error.message);
		}
	}
}

async function deployToCloudflare(destination) {
	// Placeholder for Cloudflare Pages deployment logic.
	console.warn("Cloudflare Pages deployment not implemented yet.");

	// Ensure that the directory is connected to a GitHub repo
	// ensureConnectedToGitHub(destination);
}

async function main() {
	try {
		const currentDirName = path.basename(process.cwd());

		const { packageName, destination, publishProject, publishProjectLocation } = await inquirer.prompt([
			{
				type: "input",
				name: "packageName",
				message: "How would you like to name your package?",
				default: currentDirName,
			},
			{
				type: "input",
				name: "destination",
				message: 'Where would you like to create the new project? (Provide a directory path, use "." for current directory)',
				default: ".",
			},
			{
				type: "confirm",
				name: "publishProject",
				message:
					"Do you want to publish your project to netlify or cloudflare pages now? (if n is chosen you can always do that later manually)",
			},
			{
				type: "list",
				name: "publishProjectLocation",
				message: "Where do you want to publish your project?",
				choices: ["Netlify", "Cloudflare Pages"],
				filter: function (val) {
					return val.toLowerCase();
				},
				when: (answers) => answers.publishProject,
			},
		]);

		// The rest of your logic to handle these answers goes here...

		if (!fs.existsSync(destination)) {
			fs.mkdirSync(destination, { recursive: true });
		}

		// Copy all files and subdirectories from the root directory to the destination
		copyRecursive(rootDir, destination);

		// Update package.json with the new name and author
		const packageJsonPath = path.join(destination, "package.json");
		const packageData = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		if (packageName) {
			packageData.name = packageName;
		}
		packageData.version = "0.0.1";
		packageData.author = getGitAuthorName();
		delete packageData.bin; // Remove the bin property from package.json
		delete packageData.files;
		delete packageData.main;
		delete packageData.repository;
		delete packageData.homepage;
		delete packageData.bugs;
		fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));

		console.log(`Project initialized in ${destination}`);

		if (publishProject) {
			switch (publishProjectLocation) {
				case "netlify":
					await deployToNetlify(destination);
					break;
				case "cloudflare pages":
					await deployToCloudflare(destination);
					break;
				default:
					console.error("Unknown deployment option:", publishProjectLocation);
			}
		}

		// Ask the user if they want to run the project, but only after the publishing step.
		const { runProject: shouldRunProject } = await inquirer.prompt([
			{
				type: "confirm",
				name: "runProject",
				message: "Do you want to run the project locally?",
				default: true,
			},
		]);

		// Ask user ro run the project or not
		if (shouldRunProject) {
			execSync(`cd ${destination} && pnpm install`, { stdio: "inherit" });
			console.log(`Packages installed successfully in ${destination}`);
			execSync(`cd ${destination} && pnpm dev`, { stdio: "inherit" });
		} else if (publishProject) {
			console.log(`You can run 'pnpm dev' in ${destination} whenever you're ready.`);
		}

		// Once everything is done, uninstall inquirer
		uninstallInquirer();
	} catch (error) {
		console.error("Failed to create the project:", error.message);
	}
}

main();
