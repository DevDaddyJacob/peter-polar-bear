import { GatewayIntentBits, Partials } from "discord.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { PeterPolarBearBot } from "@/bot/peterPolarBear.ts";
import { db } from "@/db/connect.ts";
import { staticMessages } from "@/db/schema.ts";
import { env } from "@/modules/envModule";
import { appLogger, printBanner } from "@/modules/loggingModule";
import { TraceInvocationAsync } from "@/utils/decorators.ts";
import { toErrorString } from "@/utils/functions.ts";

export class Application {
	public readonly discordBot: PeterPolarBearBot;

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

		await Promise.all([this.trySetupDatabase()]);

		await Promise.all([this.tryStartDiscordBot()]);

		appLogger.info("Application started");
	}

	@TraceInvocationAsync(appLogger)
	private async tryStartDiscordBot() {
		appLogger.debug("Starting Discord bot module");

		if ("N/A" === env.DISCORD_TOKEN) {
			appLogger.fatal(
				"Failed to start the discord bot. The environment variable " +
					'"DISCORD_TOKEN" is not set!'
			);
			return;
		}

		appLogger.trace(
			"Application.tryStartDiscordBot: Initiating the discord bot login using " +
				'environment variable "DISCORD_TOKEN"'
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

	@TraceInvocationAsync(appLogger)
	private async trySetupDatabase() {
		appLogger.debug("Setting up database");

		// Apply migrations
		appLogger.debug("Applying database migrations");

		try {
			await migrate(db(), { migrationsFolder: "./migrations" });
		} catch (err: unknown) {
			if (!(err instanceof Error)) {
				throw err;
			}

			appLogger.fatal(`Failed to apply database migrations!\n%s`, toErrorString(err));
			console.error(err);

			process.exit(1);
		}

		appLogger.info("Database migrations applied");

		// If no static messages exist, seed them with known data.
		const existingMessages = await db().query.staticMessages.findMany();
		if (0 === existingMessages.length) {
			await db()
				.insert(staticMessages)
				.values([
					{
						name: "getting_started",
						guildId: "1239027847918653470",
						channelId: "1239590456879353927",
						messageId: "1550240142705561631"
					},
					{
						name: "info",
						guildId: "1239027847918653470",
						channelId: "1334613350536970240",
						messageId: "1550240151995813963"
					},
					{
						name: "honey_pot",
						guildId: "1239027847918653470",
						channelId: "1542241820698742845",
						messageId: "1550240156441911467"
					}
				]);
		}

		appLogger.info("Finished setting up the database");
	}
}
