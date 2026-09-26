import type { Awaitable } from "@/utils/awaitable.ts";
import type {
	ChatInputCommandInteraction,
	GuildChannel,
	GuildMember,
	PermissionResolvable,
	Role,
} from "discord.js";
import {
	ApplicationCommandOptionType,
	ChannelType,
	VideoQualityMode
} from "discord.js";
import { Categories } from "@/bot/constants/categories.ts";
import { Channels } from "@/bot/constants/channels.ts";
import { CustomWarningEmbed } from "@/bot/constants/embeds.ts";
import { Roles } from "@/bot/constants/roles.ts";
import { getOfficeAutocompleteFunc, officeCache } from "@/bot/modules/officeModule.ts";
import { resolveGuild, } from "@/bot/utils.ts";
import { db } from "@/db/connect";
import { offices, users } from "@/db/schema.ts";
import { SlashCommandGroup } from "@/lib/bot/commands/slashCommandGroup.ts";
import { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import { SlashSubCommandGroup } from "@/lib/bot/commands/slashSubCommandGroup.ts";
import { assert } from "@/utils/functions.ts";
import { app } from "@";

const KEY_EMOJI = "🔑";
const KEY_ROLE_COLOUR = 0;
const KEY_ROLE_PERMS: PermissionResolvable[] = [];

function getKeyNameForUser(user: GuildMember): string {
	return toKeyName(`${user.displayName}'s Key`);
}

function toKeyName(name: string): string {
	return `${KEY_EMOJI} ${name}`;
}

function canBeCreated(ownerId: string, officeName: string, keyName: string): boolean {
	const existingOffice = officeCache.data.find(
		o => ownerId === o.ownerId || officeName === o.officeName || keyName === o.keyName
	);

	return undefined === existingOffice;
}

async function createOfficeChannel(name: string): Awaitable<GuildChannel> {
	const guild = await app.discordBot.iglooGuild.get();

	return await guild.channels.create({
		type: ChannelType.GuildVoice,
		name: name,
		bitrate: 64000,
		userLimit: undefined,
		rtcRegion: undefined,
		videoQualityMode: VideoQualityMode.Auto,
		nsfw: false,
		parent: Categories.OFFICE_CHANNELS
	});
}

async function createOfficeKeyRole(name: string): Awaitable<Role> {
	const guild = await app.discordBot.iglooGuild.get();

	const guildRoles = await guild.roles.fetch();
	let newKeyPosition = Number.MAX_VALUE;
	for (const entry of guildRoles) {
		const role = entry[1];
		if (role.name.startsWith(KEY_EMOJI) && role.position < newKeyPosition) {
			newKeyPosition = role.position;
		}
	}

	return await guild.roles.create({
		name: name,
		permissions: KEY_ROLE_PERMS,
		colors: {
			primaryColor: KEY_ROLE_COLOUR
		},
		hoist: false,
		mentionable: false,
		position: newKeyPosition
	});
}

async function addKeyRoleToWaitingRoom(role: Role): Awaitable {
	const guild = await app.discordBot.iglooGuild.get();

	const channel = await guild.channels.fetch(Channels.OFFICES_WAITING_ROOM);
	assert(null !== channel);
	assert("permissionOverwrites" in channel);

	await channel.permissionOverwrites.edit(role.id, {
		MoveMembers: true
	});
}

const createSubCommand = new SlashSubCommand(
	"create",
	{
		description: "Creates a new office",
		options: [
			{
				type: ApplicationCommandOptionType.User,
				name: "owner",
				description: "The owner of the office",
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: "name",
				description: "The name of the office's channel",
				required: true,
				max_length: 25
			},
			{
				type: ApplicationCommandOptionType.String,
				name: "key",
				description: "The name of the office's key role",
				required: false,
				max_length: 50
			}
		]
	},
	async (interaction: ChatInputCommandInteraction) => {
		const officeOwner = interaction.options.getUser("owner", true);
		const officeName = interaction.options.getString("name", true);
		const rawOfficeKeyName = interaction.options.getString("key", false);

		const guild = await resolveGuild(interaction);
		const member = await guild.members.fetch(officeOwner.id);

		let officeKeyName: string;
		if (null === rawOfficeKeyName) {
			officeKeyName = getKeyNameForUser(member);
		} else {
			officeKeyName = toKeyName(rawOfficeKeyName);
		}

		await interaction.deferReply({ flags: "Ephemeral" });

		// Refresh cache
		await officeCache.refresh();

		// Check for field duplicates
		const existingOffice = officeCache.data.find(
			o =>
				officeOwner.id === o.ownerId ||
				officeName === o.officeName ||
				officeKeyName === o.keyName
		);

		if (undefined !== existingOffice) {
			await interaction.editReply(
				new CustomWarningEmbed(
					"Cannot Create Office",
					"The specified parameters are already in use. " +
						"Ensure the owner doesn't have any other office " +
						"and the office and key names are not used."
				).getPayload()
			);

			return;
		}

		// Create the key role
		const keyRole = await createOfficeKeyRole(officeKeyName);

		// Create the office channel
		const officeChannel = await createOfficeChannel(officeName);

		// Update the waiting room move perms
		await addKeyRoleToWaitingRoom(keyRole);

		// Update the DB
		await db()
			.insert(users)
			.values({
				userId: officeOwner.id
			})
			.onConflictDoNothing();

		await db().insert(offices).values({
			ownerId: officeOwner.id,
			channelId: officeChannel.id,
			officeName: officeName,
			keyId: keyRole.id,
			keyName: keyRole.name
		});

		// Give the key to the office owner
		await member.roles.add([keyRole, Roles.OFFICE_OWNER], "New office created");

		// Send a welcome message in the office chat
		// TODO: create welcome message

		// Update deferrals
		await interaction.editReply("Office created!");

		// Refresh cache
		await officeCache.refresh();
	}
);

const editOfficeNameSubCommand = new SlashSubCommand(
	"channel-name",
	{
		description: "Edits the name of the office's channel",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "channel",
				description: "The target office channel",
				autocomplete: true,
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: "name",
				description: "The office's new channel name",
				required: true,
				max_length: 25
			}
		],
		autocomplete: getOfficeAutocompleteFunc("officeId")
	},
	async (interaction: ChatInputCommandInteraction) => {
		// TODO: Implement
		await interaction.editReply("Office updated!");
	}
);

const editKeyNameSubCommand = new SlashSubCommand(
	"key-name",
	{
		description: "Edits the name of the office's key role",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "channel",
				description: "The target office channel",
				autocomplete: true,
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: "name",
				description: "The office's new key role name",
				required: true,
				max_length: 50
			}
		],
		autocomplete: getOfficeAutocompleteFunc("officeId")
	},
	async (interaction: ChatInputCommandInteraction) => {
		// TODO: Implement
		await interaction.editReply("Office updated!");
	}
);

const editSubCommandGroup = new SlashSubCommandGroup(
	"edit",
	"Edits an existing office",
	editOfficeNameSubCommand,
	editKeyNameSubCommand
);

const deleteByUserSubCommand = new SlashSubCommand(
	"user",
	{
		description: "Delete's a office by specifying the user",
		options: [
			{
				type: ApplicationCommandOptionType.User,
				name: "owner",
				description: "The target office owner",
				required: true
			}
		]
	},
	async (interaction: ChatInputCommandInteraction) => {
		// TODO: Implement
		await interaction.editReply("Office deleted!");
	}
);

const deleteByChannelSubCommand = new SlashSubCommand(
	"channel",
	{
		description: "Delete's a office by specifying the user",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "channel",
				description: "The target office channel",
				autocomplete: true,
				required: true
			}
		],
		autocomplete: getOfficeAutocompleteFunc("officeId")
	},
	async (interaction: ChatInputCommandInteraction) => {
		// TODO: Implement
		await interaction.editReply("Office deleted!");
	}
);

const deleteSubCommandGroup = new SlashSubCommandGroup(
	"delete",
	"Deletes an existing office",
	deleteByUserSubCommand,
	deleteByChannelSubCommand
);

export const CommandOfficeAdmin = new SlashCommandGroup(
	"office-admin",
	{
		description: "Group of commands for managing the office system",
		dmPermission: false
	},
	createSubCommand,
	editSubCommandGroup,
	deleteSubCommandGroup
);
