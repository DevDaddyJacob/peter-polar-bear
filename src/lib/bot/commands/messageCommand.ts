import type {
	MessageContextMenuCommandInteraction,
	RESTPostAPIContextMenuApplicationCommandsJSONBody
} from "discord.js";
import type { MaybeAwaitable } from "@/utils/awaitable.ts";

import { ApplicationCommandType } from "discord.js";
import { Command } from "@/lib/bot/commands/command.ts";
import type { BotClient } from "../botClient.ts";

export class MessageCommand extends Command {
	public override readonly type = ApplicationCommandType.Message as const;
	public readonly runnable: MessageCommand.Runnable;

	public constructor(
		name: string,
		options: Partial<MessageCommand.Options>,
		runnable: MessageCommand.Runnable
	) {
		super(name, options);

		this.runnable = runnable;
	}

	public override toJSON(): RESTPostAPIContextMenuApplicationCommandsJSONBody {
		return {
			type: this.type,
			name: this.name,
			default_member_permissions: this.defaultMemberPermissions.toString(),
			dm_permission: this.dmPermission
		};
	}
}

export namespace MessageCommand {
	export interface Options extends Command.Options {}

	export type Runnable = (
		this: BotClient,
		interaction: MessageContextMenuCommandInteraction
	) => MaybeAwaitable;
}
