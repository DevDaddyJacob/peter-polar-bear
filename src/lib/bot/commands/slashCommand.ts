import type {
	APIApplicationCommandOption,
	ChatInputCommandInteraction,
	RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js";
import type { MaybeAwaitable } from "@/utils/awaitable.ts";
import type { PartialExcept } from "@/utils/types.ts";

import { ApplicationCommandType } from "discord.js";
import { Command } from "@/lib/bot/commands/command.ts";
import type { BotClient } from "../botClient.ts";

export abstract class SlashCommand extends Command {
	public override readonly type = ApplicationCommandType.ChatInput as const;

	public abstract readonly options?: APIApplicationCommandOption[];
	public readonly description: string;

	public constructor(
		name: string,
		options: PartialExcept<SlashCommand.Options, "description">
	) {
		super(name, options);

		this.description = options.description;
	}

	public override toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
		return {
			type: this.type,
			name: this.name,
			description: this.description,
			options: this.options,
			default_member_permissions: this.defaultMemberPermissions.toString(),
			dm_permission: this.dmPermission
		};
	}
}

export namespace SlashCommand {
	export interface Options extends Command.Options {
		description: string;
	}

	export type Runnable = (
		this: BotClient,
		interaction: ChatInputCommandInteraction
	) => MaybeAwaitable;
}
