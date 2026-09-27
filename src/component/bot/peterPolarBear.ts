import type {
	AnySelectMenuInteraction,
	AutocompleteInteraction,
	BaseInteraction,
	ButtonInteraction,
	ChannelSelectMenuInteraction,
	ChatInputCommandInteraction,
	ClientOptions,
	ContextMenuCommandInteraction,
	Guild,
	InteractionReplyOptions,
	MentionableSelectMenuInteraction,
	MessageContextMenuCommandInteraction,
	ModalSubmitInteraction,
	RoleSelectMenuInteraction,
	Snowflake,
	StringSelectMenuInteraction,
	TextChannel,
	UserContextMenuCommandInteraction,
	UserSelectMenuInteraction
} from "discord.js";
import type { Awaitable } from "@/utils/awaitable.ts";

import { Channels } from "@/bot/constants/channels.ts";
import { CommandErrorEmbed, CustomErrorEmbed } from "@/bot/constants/embeds.ts";
import { CommandDev } from "@/bot/modules/devCommand.ts";
import {
	GettingStartedButton,
	periodicGettingStartedScan
} from "@/bot/modules/gettingStartedModule.ts";
import {
	onEventHoneyPotMessage,
	periodicHoneyPotRefresh
} from "@/bot/modules/honeyPotModule.ts";
import { CommandMyOffice } from "@/bot/modules/myOfficeModule.ts";
import { CommandOfficeAdmin } from "@/bot/modules/officeAdminModule.ts";
import {
	CommandOffice,
	OfficeDirectoryNavButton,
	officeCache,
	onEventWaitingRoomJoin,
	periodicOfficeWaitingRoomRefresh
} from "@/bot/modules/officeModule.ts";
import { periodicRoleShopRefresh, RoleShopButton } from "@/bot/modules/roleShopModule.ts";
import { periodicRulesAndInfoRefresh } from "@/bot/modules/ruleAndInfoModule.ts";
import { getFullCommandName, tryReplyToInteraction } from "@/bot/utils.ts";
import { errorReport } from "@/error/report.ts";
import { BotClient } from "@/lib/bot/botClient.ts";
import { MessageCommand } from "@/lib/bot/commands/messageCommand.ts";
import { UserCommand } from "@/lib/bot/commands/userCommand.ts";
import { ChannelSelectMenu } from "@/lib/bot/selectMenus/channelSelectMenu.ts";
import { MentionableSelectMenu } from "@/lib/bot/selectMenus/mentionableSelectMenu.ts";
import { RoleSelectMenu } from "@/lib/bot/selectMenus/roleSelectMenu.ts";
import { StringSelectMenu } from "@/lib/bot/selectMenus/stringSelectMenu.ts";
import { UserSelectMenu } from "@/lib/bot/selectMenus/userSelectMenu.ts";
import { botLogger } from "@/modules/loggingModule.ts";
import { assert } from "@/utils/functions.ts";
import { LazyAsync } from "@/utils/lazy.ts";

export class PeterPolarBearBot extends BotClient {
	private static readonly IGLOO_GUILD_ID: Snowflake = "1239027847918653470";

	public readonly iglooGuild: LazyAsync<Guild>;

	constructor(options: ClientOptions) {
		super(options);

		this.iglooGuild = LazyAsync.of(async () =>
			this.guilds.fetch(PeterPolarBearBot.IGLOO_GUILD_ID)
		);

		this.addButton(GettingStartedButton);
		this.addButton(OfficeDirectoryNavButton);
		this.addButton(RoleShopButton);

		this.addCommandInternal(CommandDev);
		this.addCommandInternal(CommandOffice);
		this.addCommandInternal(CommandOfficeAdmin);
		this.addCommandInternal(CommandMyOffice);

		this.on(
			"messageCreate",
			this.wrapEventHandler("messageCreate", onEventHoneyPotMessage)
		);

		this.on(
			"voiceStateUpdate",
			this.wrapEventHandler("voiceStateUpdate", onEventWaitingRoomJoin)
		);
	}

	public async discordLog(
		payload: Parameters<TextChannel["send"]>[0]
	): ReturnType<TextChannel["send"]> {
		const guild = await this.iglooGuild.get();
		const channel = await guild.channels.fetch(Channels.LOGS_ALERTS);
		assert(null !== channel);
		assert(channel.isTextBased());

		return await channel.send(payload);
	}

	public async tryFindAppCommand(name: string) {
		if (null === this.application) {
			return null;
		}

		const commands = await this.application.commands.fetch({
			guildId: PeterPolarBearBot.IGLOO_GUILD_ID,
			force: true
		});

		const cmd = commands.find(c => name === c.name);
		if (undefined === cmd) {
			return null;
		}

		return cmd;
	}

	public async tryFindAppSubCommand(name: string, subCommand: string) {
		if (null === this.application) {
			return null;
		}

		const cmdGroup = await this.tryFindAppCommand(name);
		if (null === cmdGroup) {
			return null;
		}

		const cmd = cmdGroup.options.find(o => subCommand === o.name);
		if (undefined === cmd) {
			return null;
		}

		return cmd;
	}

	protected override async onReady() {
		botLogger.debug("Refreshing office cache");

		await officeCache.refresh();

		botLogger.info("Refreshed office cache");

		botLogger.debug("Updating static messages");

		await Promise.all([
			periodicGettingStartedScan(),
			periodicRulesAndInfoRefresh(),
			periodicHoneyPotRefresh(),
			periodicOfficeWaitingRoomRefresh(),
			periodicRoleShopRefresh()
		]);

		botLogger.info("Updated static messages");

		botLogger.debug("Starting static messages periodic updates");

		setInterval(periodicGettingStartedScan, 5 * 60 * 1000);
		setInterval(periodicRulesAndInfoRefresh, 15 * 60 * 1000);
		setInterval(periodicHoneyPotRefresh, 15 * 60 * 1000);
		setInterval(periodicOfficeWaitingRoomRefresh, 15 * 60 * 1000);
		setInterval(periodicRoleShopRefresh, 15 * 60 * 1000);

		botLogger.info("Started static messages periodic updates");
	}

	protected override async handleInteractionError(
		interaction: BaseInteraction,
		e: Error
	) {
		await errorReport(e, {
			console: {
				logger: botLogger
			},
			metadata: {
				discordInteraction: interaction
			}
		});

		// If the interaction cannot be replied to, stop now
		if (!interaction.isRepliable()) {
			return;
		}

		// Check if the interaction has expired
		// biome-ignore lint/style/noTernary: -
		const maxLifetime = interaction.deferred ? 900000 : 3000;
		const expiresAt = interaction.createdAt.getTime() + maxLifetime;
		if (Date.now() >= expiresAt) {
			return;
		}

		const messageContent = {
			...CommandErrorEmbed.GetCommandErrorEmbedPayload(
				`Command execution failed!\n${e.message}\n# -# Error: ${e.name}`
			),
			flags: "Ephemeral"
		};

		const [_, error] = await tryReplyToInteraction(interaction, messageContent);

		if (undefined !== error) {
			await errorReport(error, {
				discordOptions: { includePing: false },
				metadata: {
					note: "Failed to reply, follow up, or edit the existing reply of a interaction",
					interaction: interaction
				}
			});
		}
	}

	protected override async handleInteractionChatCommand(
		interaction: ChatInputCommandInteraction
	): Awaitable {
		// Try to find the application command data for this interaction
		const command = this.tryFindMatchingRunnableChatCommand(interaction);
		if (null === command) {
			const content: InteractionReplyOptions = {
				...CustomErrorEmbed.GetCustomErrorEmbedPayload(
					"Unknown Command",
					`Your attempt to use the \`${getFullCommandName(interaction)}\` ` +
						"command failed because there is no command registered with " +
						"that name."
				),
				flags: "Ephemeral"
			};

			try {
				await interaction.reply(content);
			} catch (error) {
				await errorReport(error as Error, {
					metadata: {
						interaction: interaction,
						attemptedMessageContent: content
					}
				});
			}

			return;
		}

		// Check if the command is being used by a bot
		if (await this.ensureExecutorIsNotBot(interaction)) {
			return;
		}

		// Try to run the command
		await command.runnable.call(this, interaction);
	}

	protected override async handleInteractionAutocomplete(
		interaction: AutocompleteInteraction
	): Awaitable {
		// Try to find the application command data for this interaction
		const command = this.tryFindMatchingRunnableChatCommand(interaction);
		if (null === command) {
			// TODO: some form of logging here
			botLogger.error(
				`Failed to find a matching command for command "${getFullCommandName(interaction)}"`
			);
			return;
		}

		if (null === command.autocomplete) {
			// TODO: some form of logging here
			botLogger.warn(
				`Command "${getFullCommandName(interaction)}" doesn't support autocomplete!`
			);
			return;
		}

		await command.autocomplete.call(this, interaction);
	}

	protected override async handleInteractionContextMenu(
		interaction: ContextMenuCommandInteraction
	): Awaitable {
		// Try to find the application command data for this interaction
		const command = this.commands.get(interaction.commandName);
		if (
			undefined === command ||
			!(command instanceof MessageCommand || command instanceof UserCommand)
		) {
			const content: InteractionReplyOptions = {
				...CustomErrorEmbed.GetCustomErrorEmbedPayload(
					"Unknown Command",
					`Your attempt to use the \`${interaction.commandName}\` command ` +
						"failed because there is no command registered with that name."
				),
				flags: "Ephemeral"
			};

			try {
				await interaction.reply(content);
			} catch (error) {
				await errorReport(error as Error, {
					metadata: {
						interaction: interaction,
						attemptedMessageContent: content
					}
				});
			}

			return;
		}

		// Check if the command is being used by a bot
		if (await this.ensureExecutorIsNotBot(interaction)) {
			return;
		}

		// Try to run the command
		if (command instanceof MessageCommand) {
			await command.runnable.call(
				this,
				interaction as MessageContextMenuCommandInteraction
			);
		}

		if (command instanceof UserCommand) {
			await command.runnable.call(this, interaction as UserContextMenuCommandInteraction);
		}

		assert(command instanceof MessageCommand || command instanceof UserCommand);
	}

	protected override async handleInteractionButton(
		interaction: ButtonInteraction
	): Awaitable {
		// Try to find the application command data for this interaction
		const button = this.tryFindMatchingButton(interaction);
		if (null === button) {
			const content: InteractionReplyOptions = {
				...CustomErrorEmbed.GetCustomErrorEmbedPayload(
					"Unknown Button",
					`Your attempt to use the \`${interaction.customId}\` button ` +
						"failed because there is no buttons registered with that id."
				),
				flags: "Ephemeral"
			};

			try {
				await interaction.reply(content);
			} catch (error) {
				await errorReport(error as Error, {
					metadata: {
						interaction: interaction,
						attemptedMessageContent: content
					}
				});
			}

			return;
		}

		// Check if the command is being used by a bot
		if (await this.ensureExecutorIsNotBot(interaction)) {
			return;
		}

		// Try to run the command
		await button.runnable.call(this, interaction);
	}

	protected override async handleInteractionModalSubmit(
		interaction: ModalSubmitInteraction
	): Awaitable {
		// Try to find the application command data for this interaction
		const modal = this.modals.get(interaction.customId);
		if (undefined === modal) {
			const content: InteractionReplyOptions = {
				...CustomErrorEmbed.GetCustomErrorEmbedPayload(
					"Unknown Modal",
					`Your attempt to use the \`${interaction.customId}\` modal ` +
						"failed because there is no modal registered with that id."
				),
				flags: "Ephemeral"
			};

			try {
				await interaction.reply(content);
			} catch (error) {
				await errorReport(error as Error, {
					metadata: {
						interaction: interaction,
						attemptedMessageContent: content
					}
				});
			}

			return;
		}

		// Check if the command is being used by a bot
		if (await this.ensureExecutorIsNotBot(interaction)) {
			return;
		}

		// Try to run the command
		await modal.runnable.call(this, interaction);
	}

	protected override async handleInteractionSelectMenu(
		interaction: AnySelectMenuInteraction
	): Awaitable {
		// Try to find the application command data for this interaction
		const selectMenu = this.selectMenus.get(interaction.customId);
		if (undefined === selectMenu) {
			const content: InteractionReplyOptions = {
				...CustomErrorEmbed.GetCustomErrorEmbedPayload(
					"Unknown Select Menu",
					`Your attempt to use the \`${interaction.customId}\` select menu ` +
						"failed because there is no select menu registered with that id."
				),
				flags: "Ephemeral"
			};

			try {
				await interaction.reply(content);
			} catch (error) {
				await errorReport(error as Error, {
					metadata: {
						interaction: interaction,
						attemptedMessageContent: content
					}
				});
			}

			return;
		}

		// Check if the command is being used by a bot
		if (await this.ensureExecutorIsNotBot(interaction)) {
			return;
		}

		// Try to run the command
		if (selectMenu instanceof StringSelectMenu) {
			await selectMenu.runnable.call(this, interaction as StringSelectMenuInteraction);
		}

		if (selectMenu instanceof UserSelectMenu) {
			await selectMenu.runnable.call(this, interaction as UserSelectMenuInteraction);
		}

		if (selectMenu instanceof RoleSelectMenu) {
			await selectMenu.runnable.call(this, interaction as RoleSelectMenuInteraction);
		}

		if (selectMenu instanceof MentionableSelectMenu) {
			await selectMenu.runnable.call(
				this,
				interaction as MentionableSelectMenuInteraction
			);
		}

		if (selectMenu instanceof ChannelSelectMenu) {
			await selectMenu.runnable.call(this, interaction as ChannelSelectMenuInteraction);
		}
	}

	private async ensureExecutorIsNotBot(interaction: BaseInteraction): Awaitable<boolean> {
		if (!interaction.user.bot) {
			return false;
		}

		if (!interaction.isRepliable()) {
			return true;
		}

		const content: InteractionReplyOptions = {
			...CustomErrorEmbed.GetCustomErrorEmbedPayload(
				"Action Denied",
				`Your attempt to use the this interaction ` +
					"failed because bots are prohibited from using this interaction."
			),
			flags: "Ephemeral"
		};

		try {
			await interaction.reply(content);
		} catch (error) {
			await errorReport(error as Error, {
				metadata: {
					interaction: interaction,
					attemptedMessageContent: content
				}
			});
		}

		return true;
	}
}
