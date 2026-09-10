import { defineConfig } from "drizzle-kit";
import { DATABASE_ENV_CONFIG } from "@/db/config.ts";
import { assert } from "@/utils/functions.ts";

assert(DATABASE_ENV_CONFIG.enabled);

export default defineConfig({
	dialect: "postgresql",
	schema: ".src/component/db/schema.ts",
	out: "./migrations",
	verbose: true,
	dbCredentials: {
		host: DATABASE_ENV_CONFIG.host,
		port: DATABASE_ENV_CONFIG.port,
		database: DATABASE_ENV_CONFIG.database,
		user: DATABASE_ENV_CONFIG.user,
		password: DATABASE_ENV_CONFIG.password,
		ssl: DATABASE_ENV_CONFIG.useSSL,
	}
});
