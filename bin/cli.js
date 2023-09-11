#!/usr/bin/env node

const readline = require("readline");
const { execSync } = require("child_process");
const fs = require("fs");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.question("Where would you like to download the package? (Provide a directory path) ", (downloadPath) => {
	// Close the readline interface
	rl.close();

	try {
		// Ensure the directory exists or create it
		if (!fs.existsSync(downloadPath)) {
			fs.mkdirSync(downloadPath, { recursive: true });
		}

		// Navigate to the specified directory and install the package
		execSync(`cd ${downloadPath} && npm init -y && npm install your-package-name`, { stdio: "inherit" });

		console.log(`Package downloaded successfully to ${downloadPath}`);
	} catch (error) {
		console.error("Failed to download the package:", error.message);
	}
});
