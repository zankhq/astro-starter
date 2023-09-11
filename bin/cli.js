#!/usr/bin/env node

/**
 * This script is the entry point for the CLI tool of the Astro Starter project.
 * It imports necessary modules, defines some constants, and provides utility functions
 * for copying files, checking if a command is available, and interacting with the user.
 * It also includes functions for ensuring that required tools like netlify-cli and gh are installed,
 * generating a netlify.toml file, creating a GitHub repository, and pushing changes to GitHub.
 *
 * @requires fs
 * @requires path
 * @requires child_process.execSync
 * @requires url.fileURLToPath
 * @requires path.dirname
 * @requires inquirer
 * @exports None
 */

import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import inquirer from "inquirer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, "..");

const exclusions = ["node_modules", "bin", ".git", ".astro"]; // Add any additional directories you want to exclude here

/**
 * The selected package manager for the project.
 * @type {"pnpm" | "npm" | "yarn"}
 */
let selectedPackageManager = "pnpm";

/**
 * Object containing commands for various package managers.
 * @typedef {Object} PackageManagerCommands
 * @property {Object} npm - Commands for npm package manager.
 * @property {string} npm.install - Command to install packages using npm.
 * @property {string} npm.run - Command to run scripts using npm.
 * @property {string} npm.build - Command to build project using npm.
 * @property {string} npm.dev - Command to run development server using npm.
 * @property {string} npm.list - Command to list installed packages using npm.
 * @property {string} npm.globalAdd - Command to install packages globally using npm.
 * @property {string} npm.globalList - Command to list globally installed packages using npm.
 * @property {string} npm.remove - Command to remove packages using npm.
 * @property {Object} pnpm - Commands for pnpm package manager.
 * @property {string} pnpm.install - Command to install packages using pnpm.
 * @property {string} pnpm.run - Command to run scripts using pnpm.
 * @property {string} pnpm.build - Command to build project using pnpm.
 * @property {string} pnpm.dev - Command to run development server using pnpm.
 * @property {string} pnpm.list - Command to list installed packages using pnpm.
 * @property {string} pnpm.globalAdd - Command to install packages globally using pnpm.
 * @property {string} pnpm.globalList - Command to list globally installed packages using pnpm.
 * @property {string} pnpm.remove - Command to remove packages using pnpm.
 * @property {Object} yarn - Commands for yarn package manager.
 * @property {string} yarn.install - Command to install packages using yarn.
 * @property {string} yarn.run - Command to run scripts using yarn.
 * @property {string} yarn.build - Command to build project using yarn.
 * @property {string} yarn.dev - Command to run development server using yarn.
 * @property {string} yarn.list - Command to list installed packages using yarn.
 * @property {string} yarn.globalAdd - Command to install packages globally using yarn.
 * @property {string} yarn.globalList - Command to list globally installed packages using yarn.
 * @property {string} yarn.remove - Command to remove packages using yarn.
 */

/**
 * Object containing package manager commands for npm, pnpm, and yarn.
 * @type {PackageManagerCommands}
 */
const packageManagerCommands = {
	npm: {
		install: "npm install",
		run: "npm run",
		build: "npm run build",
		dev: "npm run dev",
		list: "npm list",
		globalAdd: "npm install -g",
		globalList: "npm list -g",
		remove: "npm uninstall",
	},
	pnpm: {
		install: "pnpm install",
		run: "pnpm run",
		build: "pnpm run build",
		dev: "pnpm run dev",
		list: "pnpm list",
		globalAdd: "pnpm add -g",
		globalList: "pnpm list -g",
		remove: "pnpm remove",
	},
	yarn: {
		install: "yarn",
		run: "yarn",
		build: "yarn build",
		dev: "yarn dev",
		list: "yarn list",
		globalAdd: "yarn global add",
		globalList: "yarn global list",
		remove: "yarn remove",
	},
};

/**
 * Logs a message to the console.
 *
 * @param {string} message - The message to log.
 */
function log(message) {
	console.log(message);
}

/**
 * Logs an error message to the console.
 *
 * @param {string} message - The error message to log.
 */
function error(message) {
	console.error(message);
}

/**
 * Checks if a file or directory exists at the given path.
 * @param {string} path - The path to check for existence.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the file or directory exists, false otherwise.
 */
async function exists(path) {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * Uninstalls the "inquirer" package from the specified destination directory, if it is installed.
 * @param {string} destination - The path to the directory where the package should be uninstalled from.
 */
function uninstallInquirerIfNeeded(destination) {
	if (isPackageInstalled("inquirer", destination)) {
		console.log("Uninstalling inquirer...");
		execSync(`${packageManagerCommands[selectedPackageManager].remove} inquirer`, {
			stdio: "inherit",
			cwd: destination,
		});
	}
}

/**
 * Deletes a directory and all its contents recursively.
 *
 * @param {string} directoryPath - The path of the directory to delete.
 */
async function deleteDirectoryRecursive(directoryPath) {
	if (await exists(directoryPath)) {
		const files = await fs.readdir(directoryPath);
		for (const file of files) {
			const curPath = path.join(directoryPath, file);
			const stats = await fs.lstat(curPath);
			if (stats.isDirectory()) {
				// Recursive delete if it's a directory
				await deleteDirectoryRecursive(curPath);
			} else {
				// Delete the file
				await fs.unlink(curPath);
			}
		}
		await fs.rmdir(directoryPath); // Remove the directory itself
	}
}

/**
 * Checks if a command is available in the system.
 *
 * @param {string} command - The command to check.
 * @returns {boolean} - True if the command is available, false otherwise.
 */
function isCommandAvailable(command) {
	try {
		const output = execSync(command, { stdio: "pipe", encoding: "utf-8" });

		// Special handling for package checking commands
		if (command.includes("npm list -g") || command.includes("pnpm list -g") || command.includes("yarn global list")) {
			// Extract package name from command
			const packageName = command.split("-g")[1].trim();

			// If the output doesn't include the package name, it's not installed
			if (!output.includes(packageName)) {
				return false;
			}
		}

		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Checks if a package is installed using pnpm.
 * @param {string} packageName - The name of the package to check.
 * @param {string} destination - The directory where the project is located.
 * @returns {boolean} - True if the package is installed, false otherwise.
 */
function isPackageInstalled(packageName, destination) {
	try {
		const output = execSync(`${packageManagerCommands[selectedPackageManager].list}`, {
			stdio: "pipe",
			encoding: "utf-8",
			cwd: destination,
		});
		return output.includes(packageName);
	} catch (error) {
		console.error(`Failed to check if ${packageName} is installed:`, error.message);
		return false;
	}
}

/**
 * Copies a file or directory recursively from the source path to the destination path.
 *
 * @param {string} src - The source path.
 * @param {string} dest - The destination path.
 */
async function copyRecursive(src, dest) {
	try {
		const stats = await fs.stat(src);
		const isDirectory = stats.isDirectory();
		const isExcluded = exclusions.includes(path.basename(src));

		if (isExcluded) return;

		if (isDirectory) {
			await fs.mkdir(dest, { recursive: true });

			const children = await fs.readdir(src);
			for (const child of children) {
				await copyRecursive(path.join(src, child), path.join(dest, child));
			}
		} else {
			await fs.copyFile(src, dest);
		}
	} catch (err) {
		console.error(`Error copying from ${src} to ${dest}: ${err.message}`);
	}
}

/**
 * Gets the name of the current Git user.
 *
 * @returns {string} - The name of the current Git user.
 */
function getGitAuthorName() {
	try {
		const name = execSync("git config user.name", { encoding: "utf8" }).trim();
		return name;
	} catch (error) {
		console.warn("Failed to get git user name:", error.message);
		return "your name"; // or a default value
	}
}

/**
 * Ensures that the netlify-cli package is installed using the selected package manager.
 */
function ensureNetlifyCLI() {
	// We assume that if `pnpm list -g netlify-cli` command doesn't throw an error, then netlify-cli is installed.
	if (!isCommandAvailable(`${packageManagerCommands[selectedPackageManager].list} -g netlify-cli`)) {
		console.log(`netlify-cli is not installed. Installing using ${selectedPackageManager}...`);
		execSync(`${packageManagerCommands[selectedPackageManager].globalAdd} netlify-cli`, { stdio: "inherit" });
		console.log("netlify-cli installed successfully.");
	} else {
		console.log("netlify-cli is already installed.");
	}
}

/**
 * Ensures that the wrangler CLI is installed globally.
 * If it's not installed, it will be installed using the selected package manager.
 * @returns {void}
 */
function ensureWranglerCLI() {
	// We assume that if `pnpm list -g wrangler` command doesn't throw an error, then wrangler is installed.
	if (!isCommandAvailable(`${packageManagerCommands[selectedPackageManager].list} -g wrangler`)) {
		console.log(`wrangler is not installed. Installing using ${selectedPackageManager}...`);
		execSync(`${packageManagerCommands[selectedPackageManager].globalAdd} wrangler`, { stdio: "inherit" });
		console.log("wrangler installed successfully.");
	} else {
		console.log("wrangler is already installed.");
	}
}

/**
 * Generates a netlify.toml file at the specified destination path.
 *
 * @param {string} destination - The path where the netlify.toml file should be generated.
 */
async function generateNetlifyToml(destination) {
	const tomlContent = `
[build]
  command = "${packageManagerCommands[selectedPackageManager].build}"
  functions = "netlify/functions"
  publish = "dist"
`;

	const tomlPath = path.join(destination, "netlify.toml");
	await fs.writeFile(tomlPath, tomlContent.trim() + "\n");
	console.log(`Generated 'netlify.toml' at ${tomlPath}`);
}

/**
 * Ensures that the GitHub CLI (gh) is installed.
 */
function ensureGHCLI() {
	if (!isCommandAvailable("gh --version")) {
		console.warn("GitHub CLI (gh) is not installed but is required for certain operations.");
		console.warn("Please visit 'https://github.com/cli/cli#installation' to install the GitHub CLI.");
		process.exit(1); // Terminate the program.
	} else {
		console.log("GitHub CLI (gh) is already installed.");
	}
}

/**
 * Checks if the current directory is a Git repository.
 *
 * @returns {boolean} - True if the current directory is a Git repository, false otherwise.
 */
function isGitRepo() {
	try {
		execSync("git status", { stdio: "ignore" });
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Creates a new GitHub repository with the specified name.
 *
 * @param {string} repoName - The name of the new repository.
 */
function createGitHubRepo(repoName) {
	try {
		execSync(`gh repo create ${repoName} --confirm`, { stdio: "inherit" });
	} catch (error) {
		console.error("Failed to create the repo:", error.message);
	}
}

/**
 * Checks if the current Git repository is connected to GitHub.
 *
 * @returns {boolean} - True if the current Git repository is connected to GitHub, false otherwise.
 */
function isRepoConnectedToGitHub(destination) {
	try {
		const remoteURL = execSync("git config --get remote.origin.url", { encoding: "utf8", cwd: destination }).trim();
		return remoteURL.includes("github.com");
	} catch (error) {
		return false;
	}
}

/**
 * Pushes changes to GitHub.
 * @returns {Promise<boolean>} Returns a promise that resolves to a boolean value indicating whether the push was successful or not.
 */
/**
 * Pushes changes to GitHub.
 * @async
 * @function pushToGitHub
 * @param {string} destination - The path to the directory where the changes are located.
 * @returns {Promise<boolean>} - A promise that resolves to true if the changes were pushed successfully, or false if the user chose to continue despite the push failure.
 */
async function pushToGitHub(destination) {
	try {
		execSync("git push -u origin main", { stdio: "inherit", cwd: destination }); // assuming you're pushing the main branch
	} catch (error) {
		console.error("Failed to push to GitHub:", error.message);

		const { confirmContinue } = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirmContinue",
				message: `Failed to push changes to github, do you want to continue anyway?`,
				default: false,
			},
		]);

		if (!confirmContinue) {
			console.log("Aborted. Exiting...");
			process.exit(1); // Terminate the program.
		} else {
			return false;
		}
	}

	return true;
}

/**
 * Ensures that the current Git repository is connected to GitHub. If not, it will create a new GitHub repository and push all local changes to it.
 * @async
 * @function ensureConnectedToGitHub
 * @param {string} destination - The destination directory.
 * @returns {boolean} - Returns true if the local changes were successfully pushed to the new GitHub repository, false otherwise.
 */
async function ensureConnectedToGitHub(destination) {
	// Check if the directory is a Git repo
	if (!isGitRepo()) {
		console.error("This directory is not a Git repository. Initializing it as one.");
		execSync("git init", { stdio: "inherit", cwd: destination });
	}

	// Check if the repo is connected to GitHub
	if (!isRepoConnectedToGitHub(destination)) {
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
	}

	console.log("Pushing all local changes to github.");
	execSync("git add .", { stdio: "inherit", cwd: destination }); // Stage all files
	execSync('git commit -m "Initial commit" --allow-empty', { stdio: "inherit", cwd: destination }); // Commit changes
	var success = await pushToGitHub(destination); // Push changes to the new GitHub repo

	return success; // This handles the case where the repo is already connected to GitHub
}

/**
 * Deploys the project to Netlify.
 * @param {string} destination - The path to the directory where the project will be deployed.
 * @returns {void}
 */
async function deployToNetlify(destination) {
	console.log("Deploying to Netlify...");

	await generateNetlifyToml(destination);

	// Remove the functions folder
	const functionsDir = path.join(destination, "functions");
	await deleteDirectoryRecursive(functionsDir);
	console.log(`Removed 'functions' directory from ${destination} as is only needed for cloudflare pages.`);

	// Ensure that netlify-cli is installed
	ensureNetlifyCLI();

	// Ensure the directory is connected to GitHub
	const isGitHubConnected = await ensureConnectedToGitHub(destination); // This function now might return a boolean value.

	// Check the GitHub connection status and decide the deployment strategy
	console.log(`Starting netlify deployment, it could take some seconds.`);

	if (isGitHubConnected) {
		// Connected to GitHub, so setup continuous deployment
		try {
			execSync("netlify init", { stdio: "inherit", cwd: destination });
			console.log("Continuous deployment to Netlify set up successfully.");
		} catch (error) {
			console.error("Failed to set up continuous deployment to Netlify:", error.message);
		}
	} else {
		// Not connected to GitHub, do a manual deploy
		try {
			console.log(`Starting packages installation and build on ${destination}`);
			execSync(`${packageManagerCommands[selectedPackageManager].install}`, { stdio: "inherit", cwd: destination });
			execSync(`${packageManagerCommands[selectedPackageManager].build}`, { stdio: "inherit", cwd: destination });
			console.log(`Installation and build completed successfully. Starting netlify deployment...`);

			execSync("netlify deploy --prod", { stdio: "inherit", cwd: destination });
			console.log("Deployment to Netlify completed successfully.");
		} catch (error) {
			console.error("Failed to deploy to Netlify:", error.message);
		}
	}

	// Update HOSTING_SERVICE value in the src/const.ts file
	const constsFilePath = path.join(destination, "src", "const.ts");
	const content = await fs.readFile(constsFilePath, "utf8");
	const updatedContent = content.replace(
		/export const HOSTING_SERVICE: "cloudflare" \| "netlify" \| "none" = "[^"]+";/,
		`export const HOSTING_SERVICE: "cloudflare" | "netlify" | "none" = "netlify";`,
	);
	await fs.writeFile(constsFilePath, updatedContent, "utf8");
	console.log("Updated HOSTING_SERVICE value to 'netlify' in src/const.ts");
}

/**
 * Deploys a package to Cloudflare pages.
 * @param {string} packageName - The name of the package to deploy.
 * @param {string} destination - The destination directory to deploy to.
 * @returns {void}
 */
async function deployToCloudflare(packageName, destination) {
	console.log("Deploying to Cloudflare pages...");

	// Ensure that wrangler is installed
	ensureWranglerCLI();

	// Ensure the directory is connected to GitHub
	const isGitHubConnected = await ensureConnectedToGitHub(destination); // This function now might return a boolean value.

	// Check the GitHub connection status and decide the deployment strategy
	console.log(`Starting cloudflare pages deployment, it could take some seconds.`);

	if (isGitHubConnected) {
		// Connected to GitHub, so setup continuous deployment
		try {
			execSync(`wrangler pages project create ${packageName}`, { stdio: "inherit" });
			console.log("Cloudflare pages project set up successfully.");
		} catch (error) {
			console.error("Failed to set up continuous deployment to Cloudflare pages:", error.message);
		}
	} else {
		// Not connected to GitHub, do a manual deploy
		try {
			console.log(`Starting packages installation and build on ${destination}`);
			execSync(`${packageManagerCommands[selectedPackageManager].install}`, { stdio: "inherit", cwd: destination });
			execSync(`${packageManagerCommands[selectedPackageManager].build}`, { stdio: "inherit", cwd: destination });
			console.log(`Installation and build completed successfully. Starting netlify deployment...`);

			execSync(`wrangler pages deploy dist`, { stdio: "inherit", cwd: destination });
			console.log("Deployment to Cloudflare pages completed successfully.");
		} catch (error) {
			console.error("Failed to deploy to Cloudflare pages:", error.message);
		}
	}
}

/**
 * Checks if the given package manager is installed.
 * @param {string} packageManager - The package manager to check for (e.g., "npm", "pnpm", "yarn").
 * @returns {boolean} - Returns true if the package manager is installed, otherwise false.
 */
function isPackageManagerInstalled(packageManager) {
	try {
		// The '--version' flag is common among the three package managers to get the installed version
		execSync(`${packageManager} --version`, { stdio: "ignore" });
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Checks if the given package manager is installed.
 * If not, tries to install it.
 * @param {string} packageManager - The package manager to check for (e.g., "npm", "pnpm", "yarn").
 */
function ensurePackageManagerInstalled(packageManager) {
	const installers = {
		npm: "https://www.npmjs.com/get-npm",
		pnpm: "npm install -g pnpm",
		yarn: "npm install -g yarn",
	};

	if (!isPackageManagerInstalled(packageManager)) {
		log(`The selected package manager '${packageManager}' is not installed. Attempting to install...`);

		if (packageManager === "npm") {
			error(`Please install npm manually from ${installers.npm} and then rerun the script.`);
			return;
		}

		try {
			execSync(installers[packageManager], { stdio: "inherit" });
			console.log(`${packageManager} has been installed successfully.`);
		} catch (error) {
			console.error(`Failed to install ${packageManager}. Please install it manually and rerun the script.`);
		}
	}
}

function displayWelcomeMessage(publishProject, publishProjectLocation) {
	log("\n");
	log("==================================");
	log("=  PROJECT SUCCESSFULLY CREATED  =");
	log("==================================");
	log("\nYour project has been successfully initialized!\n");
	log("Here are some helpful tips to get you started:");
	log(`\n1. [Run the project]: ${packageManagerCommands[selectedPackageManager].dev}`);

	if (publishProject && publishProjectLocation) {
		switch (publishProjectLocation) {
			case "netlify":
				log(`2. [Open Netlify site]: netlify open`);
				break;
			case "cloudflare pages":
				log(`2. [Connect cloudflare pages to your repo]: https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/`);
				break;
			default:
				log(`2. [Deployment] For netlify or cloudflare pages deployment check:`);
				log(`	Netlify: https://docs.astro.build/en/guides/deploy/netlify`);
				log(`	Cloudflare pages: https://docs.astro.build/en/guides/deploy/cloudflare`);
		}
	} else {
		log(`2. [Deployment] For netlify or cloudflare pages deployment check:`);
		log(`	Netlify: https://docs.astro.build/en/guides/deploy/netlify`);
		log(`	Cloudflare pages: https://docs.astro.build/en/guides/deploy/cloudflare`);
	}

	log("3. [Astro docs]: https://docs.astro.build");
	log("4. [Template doc]: https://github.com/zankhq/astro-starter");
	log("\nHappy coding! 🚀\n");
	log("==================================");
	log("\n");
}

/**
 * Initializes a new project by prompting the user for project details, copying files from the root directory to the destination,
 * updating package.json with the new name and author, installing packages, and optionally deploying the project to Netlify or Cloudflare Pages.
 * @async
 * @function main
 * @returns {Promise<void>} A Promise that resolves when the project initialization is complete.
 * @throws {Error} If there is an error creating the project.
 */
async function main() {
	try {
		const currentDirName = path.basename(process.cwd());

		const { packageName, destination, packageManager, publishProject, publishProjectLocation } = await inquirer.prompt([
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
				type: "list",
				name: "packageManager",
				message: "Which package manager would you like to use?",
				choices: ["npm", "pnpm", "yarn"],
				default: "pnpm",
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

		selectedPackageManager = packageManager;

		ensurePackageManagerInstalled(selectedPackageManager);

		if (!(await exists(destination))) {
			await fs.mkdir(destination, { recursive: true });
		} else if ((await fs.readdir(destination)).filter((file) => file !== ".git").length > 0) {
			const { confirm } = await inquirer.prompt([
				{
					type: "confirm",
					name: "confirm",
					message: `The directory ${destination} is not empty. Are you sure you want to proceed and overwrite its contents?`,
					default: false,
				},
			]);

			if (!confirm) {
				console.log("Aborted. Exiting...");
				return;
			}

			// If user confirms, proceed to remove any lock file and node_modules folder
			const lockFiles = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];
			for (const lockFile of lockFiles) {
				const lockFilePath = path.join(destination, lockFile);
				if (await exists(lockFilePath)) {
					await fs.unlink(lockFilePath);
					console.log(`Removed ${lockFile}`);
				}
			}

			const nodeModulesPath = path.join(destination, "node_modules");
			if (await exists(nodeModulesPath)) {
				await fs.rmdir(nodeModulesPath, { recursive: true });
				console.log(`Removed node_modules`);
			}
		}

		// Copy all files and subdirectories from the root directory to the destination
		await copyRecursive(rootDir, destination);

		// Update package.json with the new name and author
		const packageJsonPath = path.join(destination, "package.json");
		const packageData = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
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
		if (packageData.dependencies && packageData.dependencies["inquirer"]) {
			delete packageData.dependencies["inquirer"];
		}
		await fs.writeFile(packageJsonPath, JSON.stringify(packageData, null, 2));

		console.log(`Project initialized in ${destination}`);

		if (publishProject) {
			switch (publishProjectLocation) {
				case "netlify":
					await deployToNetlify(destination);
					break;
				case "cloudflare pages":
					await deployToCloudflare(packageName, destination);
					break;
				default:
					console.error("Unknown deployment option:", publishProjectLocation);
			}
		}

		console.log(`Starting packages installation ${destination}`);
		execSync(`${packageManagerCommands[selectedPackageManager].install}`, { stdio: "inherit", cwd: destination });
		console.log(`Packages installed successfully in ${destination}`);

		displayWelcomeMessage(publishProject, publishProjectLocation);

		// It should not be necessary as it should be already been removed previously
		uninstallInquirerIfNeeded(destination);

		// Ask the user if they want to run the project, but only after the publishing step.
		const { runProject: shouldRunProject } = await inquirer.prompt([
			{
				type: "confirm",
				name: "runProject",
				message: `Do you want to run the project locally? (${packageManagerCommands[selectedPackageManager].dev})`,
				default: true,
			},
		]);

		// Ask user ro run the project or not
		if (shouldRunProject) {
			execSync(`${packageManagerCommands[selectedPackageManager].dev}`, { stdio: "inherit", cwd: destination });
		} else if (publishProject) {
			log(`You can run '${packageManagerCommands[selectedPackageManager].dev}' in ${destination} whenever you're ready.`);
			log(`🎉 Congratulations! Your project is set up and ready to go! 🎉`);
			log(`Next steps:`);
			log(`1. Dive into the code in ${destination} to start building.`);
			log(`2. Check the documentation or README for more detailed instructions.`);
			log(`3. If you have any issues or questions, don't hesitate to consult the community forums or support.`);
			log(`Happy coding! 💻`);
		}

		// Once everything is done, uninstall inquirer
	} catch (error) {
		console.error("Failed to create the project:", error.message);
	}
}

main();
