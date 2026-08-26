import type { ButtonInteraction } from "discord.js";
import type { BotClient } from "@/lib/bot/botClient.ts";
import type { MaybeAwaitable } from "@/utils/awaitable.ts";

export class Button {
	public readonly id: string;
	public readonly runnable: Button.Runnable;

	public constructor(id: string, runnable: Button.Runnable) {
		this.id = id;
		this.runnable = runnable;
	}
}

export namespace Button {
	export type Runnable = (
		this: BotClient,
		interaction: ButtonInteraction
	) => MaybeAwaitable;
}
