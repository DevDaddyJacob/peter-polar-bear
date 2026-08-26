declare global {
	const APP_ENV: "production" | "development";
	const APP_VERSION: string;
	const GIT_COMMIT_HASH: string;
	const BUILD_TIMESTAMP: string;
}

export {};
