import type { ActionRowData, UserSelectMenuComponentData } from "discord.js";

import { SelectMenu } from "@/lib/bot/selectMenus/selectMenu.ts";

export class UserSelectMenu extends SelectMenu<"UserSelect"> {
	public constructor(
		title: string,
		data: ActionRowData<UserSelectMenuComponentData>,
		runnable: SelectMenu.Runnable<"UserSelect">
	) {
		super("UserSelect", title, data, runnable);
	}
}
