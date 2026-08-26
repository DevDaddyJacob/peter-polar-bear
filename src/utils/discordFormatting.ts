// https://discord.com/developers/docs/reference#message-formatting

import type {
	ChannelResolvable,
	PartialGuildMember,
	RoleResolvable,
	Snowflake,
	UserResolvable
} from "discord.js";

import { GuildMember, Message, Role, ThreadMember, User } from "discord.js";

function resolveUserId(resolvable: UserResolvable | PartialGuildMember): Snowflake {
	if (
		resolvable instanceof User ||
		resolvable instanceof GuildMember ||
		resolvable instanceof ThreadMember ||
		("object" === typeof resolvable && "user" in resolvable)
	) {
		return resolvable.id;
	}

	if (resolvable instanceof Message) {
		return resolvable.author.id;
	}

	return resolvable;
}

function resolveChannelId(resolvable: ChannelResolvable): Snowflake {
	if ("string" === typeof resolvable) {
		return resolvable;
	}

	return resolvable.id;
}

function resolveRoleId(resolvable: RoleResolvable): Snowflake {
	if (resolvable instanceof Role) {
		return resolvable.id;
	}

	return resolvable;
}

export const DiscordFormatting = {
	Navigation: {
		Customize: () => "<id:customize>",
		Browse: () => "<id:browse>",
		Guide: () => "<id:guide>"
	},
	User: (user: UserResolvable | PartialGuildMember) => `<@${resolveUserId(user)}>`,
	Channel: (channel: ChannelResolvable) => `<#${resolveChannelId(channel)}>`,
	Role: (role: RoleResolvable) => `<@&${resolveRoleId(role)}>`,
	CustomEmoji: (name: string | { name: string; id: string }, emojiId?: Snowflake) => {
		if ("string" === typeof name) {
			return `<:${name}:${emojiId}>`;
		}

		return `<:${name.name}:${name.id}>`;
	},
	CustomAnimatedEmoji: (name: string, emojiId: Snowflake) => `<a:${name}:${emojiId}>`,
	Command: (name: string, commandId: Snowflake) => `</${name}:${commandId}>`,
	SubCommand: (name: string, subCommandName: string, commandId: Snowflake) =>
		`</${name} ${subCommandName}:${commandId}>`,
	SubCommandGroup: (
		name: string,
		subCommandGroup: string,
		subCommandName: string,
		commandId: Snowflake
	) => `</${name} ${subCommandGroup} ${subCommandName}:${commandId}>`
};

export const DF = {
	/** Navigation */
	Nav: {
		/** Customize */
		C: DiscordFormatting.Navigation.Customize,
		/** Browse */
		B: DiscordFormatting.Navigation.Browse,
		/** Guide */
		G: DiscordFormatting.Navigation.Guide
	},
	/** User */
	U: DiscordFormatting.User,
	/** Channel */
	CH: DiscordFormatting.Channel,
	/** Role */
	R: DiscordFormatting.Role,
	/** CustomEmoji */
	EC: DiscordFormatting.CustomEmoji,
	/** CustomAnimatedEmoji */
	ECA: DiscordFormatting.CustomAnimatedEmoji,
	/** Command */
	CMD: DiscordFormatting.Command,
	/** SubCommand */
	CMDS: DiscordFormatting.SubCommand,
	/** SubCommandGroup */
	CMDSG: DiscordFormatting.SubCommandGroup
};
