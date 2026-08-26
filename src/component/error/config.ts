import { env } from "@/modules/envModule.ts";
import { errorModuleLogger } from "@/modules/loggingModule.ts";

type ErrorEnvConfig = {
	filesDirPath: typeof env.ERROR.FILES_DIR_PATH;
	locationResolution: typeof env.ERROR.LOCATION_RESOLUTION;
	discordReporting:
		| {
				enabled: true;
				webhook: string;
				threadId?: string;
				roleIds: string[];
		  }
		| {
				enabled: false;
				webhook: undefined;
				threadId?: undefined;
				roleIds: [];
		  };
};

function computeEnvConfig(): ErrorEnvConfig {
	errorModuleLogger.debug(
		"Computing module configuration based on the environment variables"
	);

	const config: ErrorEnvConfig = {
		filesDirPath: env.ERROR.FILES_DIR_PATH,
		locationResolution: env.ERROR.LOCATION_RESOLUTION,
		discordReporting: {
			enabled: false,
			webhook: undefined,
			threadId: undefined,
			roleIds: []
		}
	};

	if (undefined !== env.ERROR.DISCORD_WEBHOOK) {
		config.discordReporting.enabled = true;
		config.discordReporting.webhook = env.ERROR.DISCORD_WEBHOOK;
		config.discordReporting.threadId = env.ERROR.DISCORD_THREAD_ID;
		config.discordReporting.roleIds = env.ERROR.DISCORD_PING_ROLES_ID;
	} else {
		errorModuleLogger.debug("No Discord webhook configured, Discord reporting disabled");
	}

	return config;
}

export const ERROR_ENV_CONFIG = computeEnvConfig();
