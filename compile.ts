/** biome-ignore-all lint/style/noTernary: Fine for the small tool script */

import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { Glob } from "bun";

let appEnv: "development" | "production" = "development";
if (undefined !== process.env.NODE_ENV) {
	if ("production" === process.env.NODE_ENV) {
		appEnv = "production";
	}
} else if (process.argv.includes("--production")) {
	appEnv = "production";
}

console.log(`Building for environment: ${appEnv}`);

console.log("Cleaning previous build...");

const buildFiles = existsSync("./build")
	? Array.from(new Glob("**/*").scanSync("./build"))
	: [];

await Promise.all([...buildFiles.map(f => rm(`./build/${f}`))]);

console.log("Finished cleaning previous build");

const gitHash = (await Bun.$`git rev-parse HEAD`.text()).trim();
const appVersion = require("./package.json")?.version ?? "unknown";
const buildTime = new Date().toISOString();

console.log("Compiling...");
await Bun.build({
	entrypoints: ["./src/index.ts"],
	compile: {
		target: "bun-linux-x64",
		outfile: "./build/deputron"
	},
	define: {
		APP_ENV: JSON.stringify(appEnv),
		APP_VERSION: JSON.stringify(appVersion),
		GIT_COMMIT_HASH: JSON.stringify(gitHash),
		BUILD_TIMESTAMP: JSON.stringify(buildTime)
	}
});

console.log("Finished compiling");
