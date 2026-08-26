import type {
	ActionRowData,
	AnySelectMenuInteraction,
	ChannelSelectMenuComponentData,
	ChannelSelectMenuInteraction,
	MentionableSelectMenuComponentData,
	MentionableSelectMenuInteraction,
	RoleSelectMenuComponentData,
	RoleSelectMenuInteraction,
	StringSelectMenuComponentData,
	StringSelectMenuInteraction,
	UserSelectMenuComponentData,
	UserSelectMenuInteraction
} from "discord.js";
import type { BotClient } from "@/lib/bot/botClient.ts";
import type { MaybeAwaitable } from "@/utils/awaitable.ts";
import type { KeyOf } from "@/utils/types.ts";

import { ComponentType } from "discord.js";

export type SelectMenuVariants = KeyOf<typeof SelectMenuVariantComponentTypeMap>;

const SelectMenuVariantComponentTypeMap = {
	AnySelect: -1,
	StringSelect: ComponentType.StringSelect,
	UserSelect: ComponentType.UserSelect,
	RoleSelect: ComponentType.RoleSelect,
	MentionableSelect: ComponentType.MentionableSelect,
	ChannelSelect: ComponentType.ChannelSelect
} as const;

type SelectMenuVariantDataMap = {
	AnySelect:
		| StringSelectMenuComponentData
		| UserSelectMenuComponentData
		| RoleSelectMenuComponentData
		| MentionableSelectMenuComponentData
		| ChannelSelectMenuComponentData;
	StringSelect: StringSelectMenuComponentData;
	UserSelect: UserSelectMenuComponentData;
	RoleSelect: RoleSelectMenuComponentData;
	MentionableSelect: MentionableSelectMenuComponentData;
	ChannelSelect: ChannelSelectMenuComponentData;
};

export type SelectMenuVariantInteractionMap = {
	AnySelect: AnySelectMenuInteraction;
	StringSelect: StringSelectMenuInteraction;
	UserSelect: UserSelectMenuInteraction;
	RoleSelect: RoleSelectMenuInteraction;
	MentionableSelect: MentionableSelectMenuInteraction;
	ChannelSelect: ChannelSelectMenuInteraction;
};

export abstract class SelectMenu<T extends SelectMenuVariants = "AnySelect"> {
	public readonly id: string;
	public readonly title: string;
	public readonly data: ActionRowData<SelectMenuVariantDataMap[T]>;
	public readonly runnable: SelectMenu.Runnable<T>;

	protected constructor(
		id: string,
		title: string,
		data: ActionRowData<SelectMenuVariantDataMap[T]>,
		runnable: SelectMenu.Runnable<T>
	) {
		this.id = id;
		this.title = title;
		this.data = data;
		this.runnable = runnable;
	}
}

export namespace SelectMenu {
	export type Runnable<T extends SelectMenuVariants = "AnySelect"> = (
		this: BotClient,
		interaction: SelectMenuVariantInteractionMap[T]
	) => MaybeAwaitable;
}
