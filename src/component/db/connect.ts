import type { PoolOptions } from "pg";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "@/db/relations.ts";
import { assert } from "@/utils/functions.ts";
import { DATABASE_ENV_CONFIG } from "./config.ts";

const poolOptions = () => {
	assert(DATABASE_ENV_CONFIG.enabled);

	return {
		host: DATABASE_ENV_CONFIG.host,
		port: DATABASE_ENV_CONFIG.port,
		database: DATABASE_ENV_CONFIG.database,
		user: DATABASE_ENV_CONFIG.user,
		password: DATABASE_ENV_CONFIG.password,
		ssl: DATABASE_ENV_CONFIG.useSSL
	} as PoolOptions;
};

export const db = drizzle({ client: new Pool(poolOptions()), relations });
