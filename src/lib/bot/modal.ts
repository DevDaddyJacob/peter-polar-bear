import type { ModalComponentData, ModalSubmitInteraction } from "discord.js";
import type { BotClient } from "@/lib/bot/botClient.ts";
import type { MaybeAwaitable } from "@/utils/awaitable.ts";

export class Modal {
	public readonly id: string;
	public readonly title: string;
	public readonly components: ModalComponentData["components"];
	public readonly runnable: Modal.Runnable;

	public constructor(
		id: string,
		title: string,
		components: ModalComponentData["components"],
		runnable: Modal.Runnable
	) {
		this.id = id;
		this.title = title;
		this.components = components;
		this.runnable = runnable;
	}
}

export namespace Modal {
	export type Runnable = (
		this: BotClient,
		interaction: ModalSubmitInteraction
	) => MaybeAwaitable;
}
