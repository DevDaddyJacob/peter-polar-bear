import type {
	APIApplicationCommandBasicOption,
	APIApplicationCommandSubcommandOption
} from "discord.js";
import type { SlashCommand } from "@/lib/bot/commands/slashCommand.ts";
import type { PartialExcept } from "@/utils/types.ts";

import { ApplicationCommandOptionType } from "discord.js";

export class SlashSubCommand {
	public readonly name: string;
	public readonly description: string;
	public readonly options?: APIApplicationCommandBasicOption[];
	public readonly runnable: SlashCommand.Runnable;

	public constructor(
		name: string,
		options: PartialExcept<SlashSubCommand.Options, "description">,
		runnable: SlashCommand.Runnable
	) {
		this.name = name;
		this.description = options.description;
		this.options = options.options;
		this.runnable = runnable;
	}

	public toJSON(): APIApplicationCommandSubcommandOption {
		return {
			type: ApplicationCommandOptionType.Subcommand,
			name: this.name,
			description: this.description,
			options: this.options
		};
	}
}

export namespace SlashSubCommand {
	export interface Options extends SlashCommand.Options {
		options: APIApplicationCommandBasicOption[];
	}
}
