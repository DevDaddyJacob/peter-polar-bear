import type { ActionRowData, MentionableSelectMenuComponentData } from "discord.js";

import { SelectMenu } from "@/lib/bot/selectMenus/selectMenu.ts";

export class MentionableSelectMenu extends SelectMenu<"MentionableSelect"> {
	public constructor(
		title: string,
		data: ActionRowData<MentionableSelectMenuComponentData>,
		runnable: SelectMenu.Runnable<"MentionableSelect">
	) {
		super("MentionableSelect", title, data, runnable);
	}
}
