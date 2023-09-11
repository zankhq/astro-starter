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

rl.question("Where would you like to create the new project? (Provide a directory path) ", (destination) => {
	rl.question("Do you want to install the packages now? (y/n) ", (answer) => {
		rl.close();

		try {
			if (!fs.existsSync(destination)) {
				fs.mkdirSync(destination, { recursive: true });
			}

			// Initialize the package with npm
			execSync(`cd ${destination} && npm init -y`, { stdio: "inherit" });

			// Copy all files and subdirectories from the root directory to the destination, excluding the specified ones
			copyRecursive(rootDir, destination);


			console.log(`Project initialized in ${destination}`);

			// Check user's answer and run pnpm install if confirmed
			if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
				execSync(`cd ${destination} && pnpm install`, { stdio: "inherit" });
				console.log(`Packages installed successfully in ${destination}`);
			} else {
				console.log(`You can run 'pnpm install' in ${destination} whenever you're ready.`);
			}

		} catch (error) {
			console.error("Failed to create the project:", error.message);
		}
	});
});
