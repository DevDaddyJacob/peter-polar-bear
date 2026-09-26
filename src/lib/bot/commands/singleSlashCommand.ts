import type { APIApplicationCommandBasicOption } from "discord.js";
import type { PartialExcept } from "@/utils/types.ts";

import { SlashCommand } from "@/lib/bot/commands/slashCommand.ts";

export class SingleSlashCommand extends SlashCommand {
	public override readonly options?: APIApplicationCommandBasicOption[];
	public readonly runnable: SlashCommand.Runnable;
	public readonly autocomplete: SlashCommand.AutocompleteRunnable | null;

	public constructor(
		name: string,
		options: PartialExcept<SingleSlashCommand.Options, "description">,
		runnable: SlashCommand.Runnable
	) {
		super(name, options);

		this.options = options.options;
		this.runnable = runnable;
		this.autocomplete = options.autocomplete ?? null;
	}
}

export namespace SingleSlashCommand {
	export interface Options extends SlashCommand.Options {
		options: APIApplicationCommandBasicOption[];
		autocomplete: SlashCommand.AutocompleteRunnable;
	}
}
