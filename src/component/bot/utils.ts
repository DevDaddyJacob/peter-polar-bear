import type {
	AnySelectMenuInteraction,
	BaseInteraction,
	BaseMessageOptions,
	ButtonInteraction,
	ContextMenuCommandInteraction,
	Guild,
	GuildBasedChannel,
	Message,
	ModalSubmitInteraction,
	PartialGuildMember
} from "discord.js";
import type { Awaitable } from "@/utils/awaitable.ts";
import type { Failable } from "@/utils/types.ts";

import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	GuildMember,
	Role,
	User
} from "discord.js";
import { DF } from "@/utils/discordFormatting.ts";
import { app } from "@";

export async function tryReplyToInteraction(
	interaction: BaseInteraction,
	content: BaseMessageOptions
): Awaitable<Failable<Message | null>> {
	let message: Message | null | undefined;
	let replyError: Error | undefined;
	let followUpError: Error | undefined;

	// Check if the interaction is not one we can reply to
	if (!interaction.isRepliable()) {
		return [new Error(`Cannot reply to interaction with id '${interaction.id}'`)];
	}

	// Try to reply or edit the existing reply
	try {
		if (!(interaction.replied || interaction.deferred)) {
			const response = await interaction.reply({
				...content,
				withResponse: true
			});

			message = response.resource?.message;
		} else {
			message = await interaction.editReply(content);
		}
	} catch (err) {
		replyError = new Error(`Failed to reply to interaction with id '${interaction.id}'`, {
			cause: err
		});
	}

	// Check for a successful reply
	if (undefined !== message) {
		return [message, undefined];
	}

	// Try to follow up if replying doesn't work
	try {
		message = await interaction.followUp({
			...content,
			flags: "Ephemeral"
		});
	} catch (err) {
		followUpError = new Error(
			`Failed to reply to interaction with id '${interaction.id}'`,
			{ cause: err }
		);
	}

	// Check for a successful follow-up
	if (undefined !== message) {
		return [message, undefined];
	}

	if (undefined !== replyError && undefined !== followUpError) {
		followUpError.cause = replyError;
		return [undefined, followUpError];
	}

	if (undefined !== replyError && undefined === followUpError) {
		return [undefined, replyError];
	}

	if (undefined === replyError && undefined !== followUpError) {
		return [undefined, followUpError];
	}
	return [new Error(`Failed to reply to interaction with id '${interaction.id}'`)];
}

export function getFullCommandName(interaction: BaseInteraction) {
	if (
		interaction instanceof ChatInputCommandInteraction ||
		interaction instanceof AutocompleteInteraction
	) {
		const parts = [interaction.commandName];

		const subCmdGroup = interaction.options.getSubcommandGroup(false);
		if (null !== subCmdGroup) {
			parts.push(subCmdGroup);
		}

		const subCmd = interaction.options.getSubcommand(false);
		if (null !== subCmd) {
			parts.push(subCmd);
		}

		return parts.join(" ");
	}

	if (interaction.isCommand()) {
		return interaction.commandName;
	}

	if ("customId" in interaction) {
		return interaction.customId as string;
	}

	return interaction.id;
}

export function toLogFormat(
	item: User | GuildMember | PartialGuildMember | GuildBasedChannel | Role,
	mention: boolean = false
): string {
	if (item instanceof User || item instanceof GuildMember || "user" in item) {
		if (mention) {
			return `${DF.U(item)} (${item.id} | ${item.displayName})`;
		}

		return `${item.displayName} (${item.id})`;
	}

	if (item instanceof Role) {
		if (mention) {
			return `${DF.R(item)} (${item.id} | ${item.name})`;
		}

		return `${item.name} (${item.id})`;
	}

	if (mention) {
		return `${DF.CH(item)} (${item.id} | ${item.name})`;
	}

	return `${item.name} (${item.id})`;
}

type AnyInteraction =
	| ChatInputCommandInteraction
	| ContextMenuCommandInteraction
	| ButtonInteraction
	| ModalSubmitInteraction
	| AnySelectMenuInteraction;

export function resolveGuild(interaction: AnyInteraction): Awaitable<Guild> {
	if (null === interaction.guildId) {
		throw new Error("Attempted to resolve guild for interaction without guild attached!");
	}

	return app.discordBot.guilds.fetch(interaction.guildId);
}

export async function resolveChannel(
	interaction: AnyInteraction,
	guild?: Guild
): Awaitable<GuildBasedChannel> {
	if (null === interaction.channelId) {
		throw new Error(
			"Attempted to resolve channel for interaction without channel attached!"
		);
	}

	if (undefined === guild) {
		guild = await resolveGuild(interaction);
	}

	const channel = await guild.channels.fetch(interaction.channelId);
	if (null === channel) {
		throw new Error(
			`No channel found with id "${interaction.guildId}" ` +
				`in guild with id "${guild.id}"`
		);
	}

	return channel;
}

export async function resolveGuildExecutor(
	interaction: AnyInteraction,
	guild?: Guild
): Awaitable<GuildMember> {
	if (undefined === guild) {
		guild = await resolveGuild(interaction);
	}

	return await guild.members.fetch(interaction.user.id);
}

export function resolveExecutor(interaction: AnyInteraction): Awaitable<User> {
	return app.discordBot.users.fetch(interaction.user.id);
}
