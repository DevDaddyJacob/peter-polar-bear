import type { ActionRowData, ChannelSelectMenuComponentData } from "discord.js";

import { SelectMenu } from "@/lib/bot/selectMenus/selectMenu.ts";

export class ChannelSelectMenu extends SelectMenu<"ChannelSelect"> {
	public constructor(
		title: string,
		data: ActionRowData<ChannelSelectMenuComponentData>,
		runnable: SelectMenu.Runnable<"ChannelSelect">
	) {
		super("ChannelSelect", title, data, runnable);
	}
}
