import { env } from "@/modules/envModule.ts";
import { databaseLogger } from "@/modules/loggingModule.ts";

type TrueDatabaseEnvConfig = {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
	useSSL:
		| undefined
		| "disable"
		| "allow"
		| "prefer"
		| "require"
		| "verify-ca"
		| "verify-full";
};

type DatabaseEnvConfig = { enabled: false } | ({ enabled: true } & TrueDatabaseEnvConfig);

function computeEnvConfig(): DatabaseEnvConfig {
	databaseLogger.debug(
		"Computing module configuration based on the environment variables"
	);

	let invalid = false;
	const config: Partial<DatabaseEnvConfig> = {
		enabled:
			undefined !== env.DATABASE.HOST ||
			undefined !== env.DATABASE.PORT ||
			undefined !== env.DATABASE.DATABASE ||
			undefined !== env.DATABASE.USER ||
			undefined !== env.DATABASE.PASSWORD
	};

	if (!config.enabled) {
		databaseLogger.debug("Module not configured, skipping.");
		return config as DatabaseEnvConfig;
	}

	config.useSSL = env.DATABASE.USE_SSL;

	if (undefined !== env.DATABASE.HOST) {
		config.host = env.DATABASE.HOST;
	} else {
		invalid = true;
		databaseLogger.warn(
			'No database host configured! (environment variable: "DATABASE_HOST")'
		);
	}

	if (undefined !== env.DATABASE.PORT) {
		config.port = env.DATABASE.PORT;
	} else {
		invalid = true;
		databaseLogger.warn(
			'No database port configured! (environment variable: "DATABASE_PORT")'
		);
	}

	if (undefined !== env.DATABASE.DATABASE) {
		config.database = env.DATABASE.DATABASE;
	} else {
		invalid = true;
		databaseLogger.warn(
			'No database database configured! (environment variable: "DATABASE_DATABASE")'
		);
	}

	if (undefined !== env.DATABASE.USER) {
		config.user = env.DATABASE.USER;
	} else {
		invalid = true;
		databaseLogger.warn(
			'No database user configured! (environment variable: "DATABASE_USER")'
		);
	}

	if (undefined !== env.DATABASE.PASSWORD) {
		config.password = env.DATABASE.PASSWORD;
	} else {
		invalid = true;
		databaseLogger.warn(
			'No database password configured! (environment variable: "DATABASE_PASSWORD")'
		);
	}

	if (invalid) {
		return { enabled: false };
	}

	return config as DatabaseEnvConfig;
}

export const DATABASE_ENV_CONFIG = computeEnvConfig();
