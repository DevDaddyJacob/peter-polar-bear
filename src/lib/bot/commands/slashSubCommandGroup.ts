import type { APIApplicationCommandSubcommandGroupOption } from "discord.js";
import type { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import type { NonEmptyArray } from "@/utils/types.ts";

import { ApplicationCommandOptionType } from "discord.js";

export class SlashSubCommandGroup {
	public readonly name: string;
	public readonly description: string;
	public readonly subCommands: NonEmptyArray<SlashSubCommand>;

	public constructor(
		name: string,
		description: string,
		...subCommands: NonEmptyArray<SlashSubCommand>
	) {
		this.name = name;
		this.description = description;
		this.subCommands = subCommands;
	}

	public toJSON(): APIApplicationCommandSubcommandGroupOption {
		return {
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: this.name,
			description: this.description,
			options: this.subCommands.map(c => c.toJSON())
		};
	}
}
