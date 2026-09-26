import { defineConfig } from "drizzle-kit";
import { assert } from "@/utils/functions.ts";
import { DATABASE_ENV_CONFIG } from "@/db/config.ts";
import type { ConnectionOptions } from "node:tls";

type KitSSL =
	| boolean
	| "require"
	| "allow"
	| "prefer"
	| "verify-full"
	| ConnectionOptions
	| undefined;

assert(DATABASE_ENV_CONFIG.enabled);

const toKitSSL = (mode: any): KitSSL => {
	switch (mode) {
		case "disable":
			return false;
		case "verify-ca":
			// verify the CA chain, but skip hostname verification
			return { rejectUnauthorized: true, checkServerIdentity: () => undefined };
		default:
			return mode;
	}
};

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/component/db/schema.ts",
	out: "./migrations",
	verbose: true,
	dbCredentials: {
		host: DATABASE_ENV_CONFIG.host,
		port: DATABASE_ENV_CONFIG.port,
		database: DATABASE_ENV_CONFIG.database,
		user: DATABASE_ENV_CONFIG.user,
		password: DATABASE_ENV_CONFIG.password,
		ssl: toKitSSL(DATABASE_ENV_CONFIG.useSSL),
	}
});
