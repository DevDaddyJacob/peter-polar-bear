import type { ButtonInteraction } from "discord.js";
import type { BotClient } from "@/lib/bot/botClient.ts";
import type { MaybeAwaitable } from "@/utils/awaitable.ts";

import { Button } from "@/lib/bot/buttons/button.ts";

export class FuzzyButton extends Button {
	public readonly mode: "regex" | "startsWith" | "endsWith";

	public constructor(
		id: string,
		mode: "regex" | "startsWith" | "endsWith",
		runnable: Button.Runnable
	) {
		super(id, runnable);
		this.mode = mode;
	}

	public override doesIdMatch(id: string): boolean {
		switch (this.mode) {
			case "regex": {
				return new RegExp(this.id).test(id);
			}

			case "startsWith": {
				return id.startsWith(this.id);
			}

			case "endsWith": {
				return id.endsWith(this.id);
			}
		}
	}
}

export namespace FuzzyButton {
	export type Runnable = (
		this: BotClient,
		interaction: ButtonInteraction
	) => MaybeAwaitable;
}
