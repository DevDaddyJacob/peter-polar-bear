import type {
	RESTPostAPIContextMenuApplicationCommandsJSONBody,
	UserContextMenuCommandInteraction
} from "discord.js";
import type { BotClient } from "@/lib/bot/botClient.ts";
import type { MaybeAwaitable } from "@/utils/awaitable.ts";

import { ApplicationCommandType } from "discord.js";
import { Command } from "@/lib/bot/commands/command.ts";

export class UserCommand extends Command {
	public override readonly type = ApplicationCommandType.User as const;
	public readonly runnable: UserCommand.Runnable;

	public constructor(
		name: string,
		options: UserCommand.Options,
		runnable: UserCommand.Runnable
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

export namespace UserCommand {
	export interface Options extends Command.Options {}

	export type Runnable = (
		this: BotClient,
		interaction: UserContextMenuCommandInteraction
	) => MaybeAwaitable;
}
