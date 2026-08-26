import type {
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption
} from "discord.js";
import type { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import type { SlashSubCommandGroup } from "@/lib/bot/commands/slashSubCommandGroup.ts";
import type { NonEmptyArray, PartialExcept } from "@/utils/types.ts";

import { SlashCommand } from "@/lib/bot/commands/slashCommand.ts";

export class SlashCommandGroup extends SlashCommand {
	public override readonly options?: (
		| APIApplicationCommandSubcommandGroupOption
		| APIApplicationCommandSubcommandOption
	)[];

	public readonly subCommands: NonEmptyArray<SlashSubCommand | SlashSubCommandGroup>;

	public constructor(
		name: string,
		options: PartialExcept<SlashCommandGroup.Options, "description">,
		...subCommands: NonEmptyArray<SlashSubCommand | SlashSubCommandGroup>
	) {
		super(name, options);

		this.options = subCommands.map(c => c.toJSON());
		this.subCommands = subCommands;
	}
}

export namespace SlashCommandGroup {
	export interface Options extends SlashCommand.Options {}
}
