import type { ActionRowData, StringSelectMenuComponentData } from "discord.js";

import { SelectMenu } from "@/lib/bot/selectMenus/selectMenu.ts";

export class StringSelectMenu extends SelectMenu<"StringSelect"> {
	public constructor(
		title: string,
		data: ActionRowData<StringSelectMenuComponentData>,
		runnable: SelectMenu.Runnable<"StringSelect">
	) {
		super("StringSelect", title, data, runnable);
	}
}
