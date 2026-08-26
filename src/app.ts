import { GatewayIntentBits, Partials } from "discord.js";
import { PeterPolarBearBot } from "@/bot/peterPolarBear.ts";
import { env } from "@/modules/envModule";
import { appLogger, printBanner } from "@/modules/loggingModule";
import { TraceInvocationAsync } from "@/utils/decorators.ts";
import { toErrorString } from "@/utils/functions.ts";

export class Application {
	private discordBot: PeterPolarBearBot;

	public constructor() {
		this.discordBot = new PeterPolarBearBot({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildModeration,
				GatewayIntentBits.GuildExpressions,
				GatewayIntentBits.GuildIntegrations,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.GuildInvites,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.DirectMessageReactions,
				GatewayIntentBits.DirectMessageTyping,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildScheduledEvents,
				GatewayIntentBits.AutoModerationConfiguration,
				GatewayIntentBits.AutoModerationExecution,
				GatewayIntentBits.GuildMessagePolls,
				GatewayIntentBits.DirectMessagePolls
			],
			partials: [Partials.Channel]
		});
	}

	public async start() {
		printBanner();
		appLogger.info(`========== Launching Application Version ${APP_VERSION} ==========`);

		appLogger.debug("Starting application");

		await Promise.all([this.tryStartDiscordBot()]);

		appLogger.info("Application started");
	}

	@TraceInvocationAsync(appLogger)
	private async tryStartDiscordBot() {
		appLogger.debug("Starting Discord bot module");

		if ("N/A" === env.DISCORD_TOKEN) {
			appLogger.fatal(
				'Failed to start the discord bot. The environment variable "DISCORD_TOKEN" is not set!'
			);
			return;
		}

		appLogger.trace(
			'Application.tryStartDiscordBot: Initiating the discord bot login using environment variable "DISCORD_TOKEN"'
		);
		try {
			await this.discordBot.login(env.DISCORD_TOKEN);
		} catch (e: unknown) {
			if (e instanceof Error) {
				appLogger.error(
					e,
					"Failed to start the discord bot. " +
						"Encountered an error while invoking the Discord API login.\n%s",
					toErrorString(e)
				);
			}
			return;
		}

		appLogger.info("Started Discord bot module");
	}
}
