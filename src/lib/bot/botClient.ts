import type {
	AnySelectMenuInteraction,
	AutocompleteInteraction,
	BaseInteraction,
	ButtonInteraction,
	ChatInputCommandInteraction,
	ClientEvents,
	ClientOptions,
	ContextMenuCommandInteraction,
	ModalSubmitInteraction
} from "discord.js";
import type { Button } from "@/lib/bot/buttons/button.ts";
import type { Command } from "@/lib/bot/commands/command.ts";
import type { Modal } from "@/lib/bot/modal.ts";
import type { SelectMenu } from "@/lib/bot/selectMenus/selectMenu.ts";
import type { Awaitable, MaybeAwaitable } from "@/utils/awaitable.ts";

import { Client, Collection } from "discord.js";
import { errorReport } from "@/error/report.ts";
import { MessageCommand } from "@/lib/bot/commands/messageCommand.ts";
import { SingleSlashCommand } from "@/lib/bot/commands/singleSlashCommand.ts";
import { SlashCommandGroup } from "@/lib/bot/commands/slashCommandGroup.ts";
import { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import { SlashSubCommandGroup } from "@/lib/bot/commands/slashSubCommandGroup.ts";
import { UserCommand } from "@/lib/bot/commands/userCommand.ts";
import { botLogger } from "@/modules/loggingModule";
import { TraceInvocation, TraceInvocationAsync } from "@/utils/decorators.ts";
import { jsonStringify } from "@/utils/stringify.ts";

export abstract class BotClient extends Client {
	protected readonly commands: Collection<string, Command> = new Collection();
	protected readonly buttons: Collection<string, Button> = new Collection();
	protected readonly modals: Collection<string, Modal> = new Collection();
	protected readonly selectMenus: Collection<string, SelectMenu> = new Collection();

	protected constructor(options: ClientOptions) {
		super(options);

		this.on("interactionCreate", this.handleInteractions);

		this.once("clientReady", async () => {
			botLogger.trace(
				"BotClient<clientReady>: Discord client ready, initializing bot instance"
			);

			await this.refreshCommands();

			botLogger.info("Discord bot initialized and ready");

			await this.onReady();
		});
	}

	public async addCommand(command: Command) {
		if (this.commands.has(command.name)) {
			return;
		}

		this.commands.set(command.name, command);

		await this.refreshCommands();
	}

	public async removeCommand(commandOrName: Command | string) {
		// biome-ignore lint/style/noTernary: I'll suffer
		const name = "string" === typeof commandOrName ? commandOrName : commandOrName.name;

		if (this.commands.delete(name)) {
			await this.refreshCommands();
		}
	}

	public addButton(button: Button) {
		if (this.buttons.has(button.id)) {
			return;
		}

		this.buttons.set(button.id, button);
	}

	public removeButton(buttonOrId: Button | string) {
		if ("string" === typeof buttonOrId) {
			this.buttons.delete(buttonOrId);
			return;
		}

		this.buttons.delete(buttonOrId.id);
	}

	public addModal(modal: Modal) {
		if (this.modals.has(modal.id)) {
			return;
		}

		this.modals.set(modal.id, modal);
	}

	public removeModal(modalOrId: Modal | string) {
		if ("string" === typeof modalOrId) {
			this.modals.delete(modalOrId);
			return;
		}

		this.modals.delete(modalOrId.id);
	}

	public addSelectMenu(selectMenu: SelectMenu) {
		if (this.selectMenus.has(selectMenu.id)) {
			return;
		}

		this.selectMenus.set(selectMenu.id, selectMenu);
	}

	public removeSelectMenu(selectMenuOrId: SelectMenu | string) {
		if ("string" === typeof selectMenuOrId) {
			this.selectMenus.delete(selectMenuOrId);
			return;
		}

		this.selectMenus.delete(selectMenuOrId.id);
	}

	protected wrapEventHandler<E extends keyof ClientEvents>(
		event: E,
		func: (...args: ClientEvents[E]) => MaybeAwaitable
	): (...args: ClientEvents[E]) => Awaitable {
		return async (...args: ClientEvents[E]) => {
			try {
				await func.bind(this)(...args);
			} catch (err) {
				await errorReport(err as Error, {
					metadata: {
						event: event,
						args: jsonStringify(args)
					}
				});
			}
		};
	}

	protected addCommandInternal(command: Command) {
		if (this.commands.has(command.name)) {
			return;
		}

		this.commands.set(command.name, command);
	}

	// biome-ignore lint/suspicious/useAwait: Designed for overriding
	protected async handleInteractionError(interaction: BaseInteraction, error: Error) {
		botLogger.error(error);
	}

	@TraceInvocation(botLogger)
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: not something to split up
	protected tryFindMatchingRunnableChatCommand(
		interaction: ChatInputCommandInteraction | AutocompleteInteraction
	): SingleSlashCommand | SlashSubCommand | null {
		const logPrefix = "BotClient.tryFindMatchingRunnableChatCommand:";

		const cmdName = interaction.commandName;
		const cmdSubCommandName = interaction.options.getSubcommand(false);
		const cmdSubCommandGroupName = interaction.options.getSubcommandGroup(false);
		botLogger.trace(
			`${logPrefix} finding match for ` +
				`name "${cmdName}", ` +
				`subcommand name "${cmdSubCommandName ?? "<null>"}", ` +
				`and subcommand group name "${cmdSubCommandGroupName ?? "<null>"}"`
		);

		const cmd = this.commands.get(cmdName);
		if (
			undefined === cmd ||
			cmd instanceof MessageCommand ||
			cmd instanceof UserCommand
		) {
			botLogger.trace(`${logPrefix} no matching command for name "${cmdName}"`);
			return null;
		}

		// Looking for a single command
		if (null === cmdSubCommandName && null === cmdSubCommandGroupName) {
			botLogger.trace(`${logPrefix} looking for a single command "${cmdName}"`);

			if (cmd instanceof SingleSlashCommand) {
				return cmd;
			}

			botLogger.trace(
				`${logPrefix} found command is not of type '${SingleSlashCommand.name}'`
			);
			return null;
		}

		// Looking for a single sub command
		if (null !== cmdSubCommandName && null === cmdSubCommandGroupName) {
			botLogger.trace(
				`${logPrefix} looking for a single sub command "${cmdSubCommandName}"`
			);

			if (!(cmd instanceof SlashCommandGroup)) {
				botLogger.trace(
					`${logPrefix} found command is not of type '${SlashCommandGroup.name}'`
				);
				return null;
			}

			const subCmd = cmd.subCommands.find(c => c.name === cmdSubCommandName);
			if (undefined === subCmd || !(subCmd instanceof SlashSubCommand)) {
				if (undefined === subCmd) {
					botLogger.trace(`${logPrefix} subcommand was not found`);
				} else {
					botLogger.trace(
						`${logPrefix} found subcommand is not of type '${SlashSubCommand.name}'`
					);
				}

				return null;
			}

			return subCmd;
		}

		// Looking for a sub command in a subgroup
		if (null !== cmdSubCommandName && null !== cmdSubCommandGroupName) {
			botLogger.trace(
				`${logPrefix} looking for a sub command "${cmdSubCommandName}" ` +
					`in a subgroup "${cmdSubCommandGroupName}"`
			);

			if (!(cmd instanceof SlashCommandGroup)) {
				botLogger.trace(
					`${logPrefix} found command is not of type '${SlashCommandGroup.name}'`
				);
				return null;
			}

			const subCmdGroup = cmd.subCommands.find(c => c.name === cmdSubCommandGroupName);
			if (undefined === subCmdGroup || !(subCmdGroup instanceof SlashSubCommandGroup)) {
				if (undefined === subCmdGroup) {
					botLogger.trace(`${logPrefix} subcommand group was not found`);
				} else {
					botLogger.trace(
						`${logPrefix} found subcommand group is not of type ` +
							`'${SlashSubCommandGroup.name}'`
					);
				}

				return null;
			}

			const subCmd = subCmdGroup.subCommands.find(c => c.name === cmdSubCommandName);
			if (undefined === subCmd || !(subCmd instanceof SlashSubCommand)) {
				if (undefined === subCmd) {
					botLogger.trace(`${logPrefix} subcommand was not found`);
				} else {
					botLogger.trace(
						`${logPrefix} found subcommand is not of type '${SlashSubCommand.name}'`
					);
				}

				return null;
			}

			return subCmd;
		}

		botLogger.warn(
			`Failed to find any matching command for ` +
				`name "${cmdName}", ` +
				`subcommand name "${cmdSubCommandName ?? "<null>"}", ` +
				`and subcommand group name "${cmdSubCommandGroupName ?? "<null>"}"`
		);

		return null;
	}

	@TraceInvocation(botLogger)
	protected tryFindMatchingButton(interaction: ButtonInteraction): Button | null {
		const id = interaction.customId;

		const matchingButtons = this.buttons.find(b => b.doesIdMatch(id));

		if (undefined !== matchingButtons) {
			return matchingButtons;
		}

		return null;
	}

	protected async handleInteractionChatCommand(
		i: ChatInputCommandInteraction
	): Awaitable {
		/* no-op */
	}

	protected async handleInteractionAutocomplete(i: AutocompleteInteraction): Awaitable {
		/* no-op */
	}

	protected async handleInteractionContextMenu(
		i: ContextMenuCommandInteraction
	): Awaitable {
		/* no-op */
	}

	protected async handleInteractionButton(i: ButtonInteraction): Awaitable {
		/* no-op */
	}

	protected async handleInteractionSelectMenu(i: AnySelectMenuInteraction): Awaitable {
		/* no-op */
	}

	protected async handleInteractionModalSubmit(i: ModalSubmitInteraction): Awaitable {
		/* no-op */
	}

	protected async onReady(): Awaitable {
		/* no-op */
	}

	@TraceInvocationAsync(botLogger)
	private async refreshCommands() {
		if (!this.isReady()) {
			botLogger.warn("Bot client attempted to refresh commands while not ready!");
			return;
		}

		botLogger.debug("Refreshing commands against API");

		const guilds = await this.guilds.fetch();
		botLogger.debug(`Found x${guilds.size} guilds to register commands in`);

		const commandsJson = this.commands.mapValues(c => c.toJSON());

		await Promise.all([
			this.application.commands.set([]),
			...guilds.map(g =>
				this.application.commands.set(commandsJson.values().toArray(), g.id)
			)
		]);
	}

	private async handleInteractions(interaction: BaseInteraction) {
		try {
			if (interaction.isChatInputCommand()) {
				return await this.handleInteractionChatCommand(interaction);
			}

			if (interaction.isAutocomplete()) {
				return await this.handleInteractionAutocomplete(interaction);
			}

			if (interaction.isButton()) {
				return await this.handleInteractionButton(interaction);
			}

			if (interaction.isContextMenuCommand()) {
				return await this.handleInteractionContextMenu(interaction);
			}

			if (interaction.isAnySelectMenu()) {
				return await this.handleInteractionSelectMenu(interaction);
			}

			if (interaction.isModalSubmit()) {
				return await this.handleInteractionModalSubmit(interaction);
			}
		} catch (e: unknown) {
			if (e instanceof Error) {
				await this.handleInteractionError(interaction, e);
			}
		}
	}
}
