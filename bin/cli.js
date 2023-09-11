#!/usr/bin/env node

import readline from "readline";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, "..");

const exclusions = ["node_modules", "bin"]; // Add any additional directories you want to exclude here

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

rl.question("How would you like to name your package? ", (packageName) => {
	rl.question('Where would you like to create the new project? (Provide a directory path, use "." for current directory)', (destination) => {
		rl.question("Do you want to install the packages now? (y/n) ", (answer) => {
			try {
				if (!fs.existsSync(destination)) {
					fs.mkdirSync(destination, { recursive: true });
				}

				// Copy all files and subdirectories from the root directory to the destination, excluding the specified ones
				copyRecursive(rootDir, destination);

				// Update package.json with the new name and author
				const packageJsonPath = path.join(destination, "package.json");
				const packageData = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
				if (packageName) {
					packageData.name = packageName;
				}
				packageData.varsion = "0.0.1";
				packageData.author = getGitAuthorName(); // Set the author from git config
				delete packageData.bin; // Remove the bin property from package.json
				delete packageData.files;
				delete packageData.main;
				delete packageData.repository;
				delete packageData.homepage;
				delete packageData.bugs;
				fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));

				console.log(`Project initialized in ${destination}`);

				// Check user's answer and run pnpm install if confirmed
				if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
					execSync(`cd ${destination} && pnpm install`, { stdio: "inherit" });
					console.log(`Packages installed successfully in ${destination}`);

					rl.question("Do you want to run the project now? (y/n) ", (answer) => {
						try {
							if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
								execSync(`cd ${destination} && pnpm dev`, { stdio: "inherit" });
							} else {
								console.log(`You can run 'pnpm dev' in ${destination} whenever you're ready.`);
							}
						} catch (error) {
							console.error("Failed to run the project:", error.message);
						}
						rl.close();
					});
				} else {
					console.log(`You can run 'pnpm install' in ${destination} whenever you're ready.`);
					rl.close();
				}
			} catch (error) {
				console.error("Failed to create the project:", error.message);
				rl.close();
			}
		});
	});
});
