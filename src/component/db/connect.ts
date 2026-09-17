import { drizzle } from "drizzle-orm/bun-sql";
import { DATABASE_ENV_CONFIG } from "@/db/config.ts";
import { relations } from "@/db/relations.ts";
import { assert } from "@/utils/functions";

assert(DATABASE_ENV_CONFIG.enabled);

const _db = drizzle({
	relations,
	connection: {
		hostname: DATABASE_ENV_CONFIG.host,
		port: DATABASE_ENV_CONFIG.port,
		database: DATABASE_ENV_CONFIG.database,
		username: DATABASE_ENV_CONFIG.user,
		password: DATABASE_ENV_CONFIG.password,
		ssl: DATABASE_ENV_CONFIG.useSSL
	}
});

export async function disconnect() {
	await _db.$client.end();
}

export const db = () => _db;
