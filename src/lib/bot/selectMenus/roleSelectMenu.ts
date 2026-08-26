import type { ActionRowData, RoleSelectMenuComponentData } from "discord.js";

import { SelectMenu } from "@/lib/bot/selectMenus/selectMenu.ts";

export class RoleSelectMenu extends SelectMenu<"RoleSelect"> {
	public constructor(
		title: string,
		data: ActionRowData<RoleSelectMenuComponentData>,
		runnable: SelectMenu.Runnable<"RoleSelect">
	) {
		super("RoleSelect", title, data, runnable);
	}
}
