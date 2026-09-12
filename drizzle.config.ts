import { defineConfig } from "drizzle-kit";
import { DATABASE_ENV_CONFIG } from "@/db/config.ts";
import { assert } from "@/utils/functions.ts";

const getEnv = (key: string) => {
	const val = process.env[key];
	assert(undefined !== val);
	return val;
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/component/db/schema.ts",
	out: "./migrations",
	verbose: true,
	dbCredentials: {
		host: getEnv("DATABASE_HOST"),
		port: Number.parseInt(getEnv("DATABASE_PORT")),
		database: getEnv("DATABASE_DATABASE"),
		user: getEnv("DATABASE_USER"),
		password: getEnv("DATABASE_PASSWORD"),
		ssl: "true" === getEnv("DATABASE_USE_SSL"),
	}
});
