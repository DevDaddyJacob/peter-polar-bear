import type { BaseInteraction, BaseMessageOptions, Message } from "discord.js";
import type { Awaitable } from "@/utils/awaitable.ts";
import type { Failable } from "@/utils/types.ts";

import { ChatInputCommandInteraction } from "discord.js";

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
	if (interaction instanceof ChatInputCommandInteraction) {
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
