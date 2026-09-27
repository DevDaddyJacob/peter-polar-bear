import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import type { DbOffice } from "@/db/types.ts";
import type { Awaitable } from "@/utils/awaitable.ts";

import { ApplicationCommandOptionType } from "discord.js";
import { eq } from "drizzle-orm";
import { BaseEmbed, CustomWarningEmbed } from "@/bot/constants/embeds.ts";
import { toKeyName } from "@/bot/modules/officeAdminModule.ts";
import { officeCache } from "@/bot/modules/officeModule.ts";
import { resolveGuild, resolveGuildExecutor } from "@/bot/utils.ts";
import { db } from "@/db/connect.ts";
import { offices } from "@/db/schema.ts";
import { SlashCommandGroup } from "@/lib/bot/commands/slashCommandGroup.ts";
import { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import { SlashSubCommandGroup } from "@/lib/bot/commands/slashSubCommandGroup.ts";

async function getOfficeForMember(member: GuildMember): Awaitable<DbOffice | null> {
	return (
		(await db().query.offices.findFirst({
			where: {
				ownerId: member.id
			}
		})) ?? null
	);
}

function getNoOwnedOfficePayload() {
	return new CustomWarningEmbed(
		"No Owned Office",
		"You must own an office to use this command, and you do not own one."
	).getPayload();
}

const keyholdersSubCommand = new SlashSubCommand(
	"keyholders",
	{
		description: "Lists all of the people with your office key"
	},
	async (interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply({ flags: "Ephemeral" });

		const guild = await resolveGuild(interaction);
		const executor = await resolveGuildExecutor(interaction, guild);

		const office = await getOfficeForMember(executor);
		if (null === office) {
			await interaction.editReply(getNoOwnedOfficePayload());
			return;
		}

		const guildMembers = await guild.members.fetch();
		const keyHolders = guildMembers.filter(m => m.roles.cache.has(office.keyId));

		await interaction.editReply({
			embeds: [
				new BaseEmbed({
					title: "Office Keyholders",
					description:
						`The following are the people who have a key to your office:` +
						`\n${keyHolders.map(u => `◦ ${u.displayName}`).join("\n")}`
				})
			],
			allowedMentions: {
				parse: [],
				roles: [],
				users: []
			}
		});
	}
);

const renameSubCommand = new SlashSubCommand(
	"rename",
	{
		description: "Edits the name of the your office's channel",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "name",
				description: "The office's new channel name",
				required: true,
				max_length: 25
			}
		]
	},
	async (interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply({ flags: "Ephemeral" });

		const guild = await resolveGuild(interaction);
		const executor = await resolveGuildExecutor(interaction, guild);

		const office = await getOfficeForMember(executor);
		if (null === office) {
			await interaction.editReply(getNoOwnedOfficePayload());
			return;
		}

		const channel = await guild.channels.fetch(office.channelId);
		if (null === channel) {
			throw new Error(`Failed to fetch channel with id "${office.channelId}"`);
		}

		const name = interaction.options.getString("name", true);

		await db()
			.update(offices)
			.set({
				officeName: name
			})
			.where(eq(offices.officeId, office.officeId));

		await officeCache.refresh();

		await channel.setName(name);

		await interaction.editReply("Office name updated!");
	}
);

const keyGrantSubCommand = new SlashSubCommand(
	"grant",
	{
		description: "Gives your office's key to someone",
		options: [
			{
				type: ApplicationCommandOptionType.User,
				name: "user",
				description: "The user to give the key to",
				required: true
			}
		]
	},
	async (interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply({ flags: "Ephemeral" });

		const guild = await resolveGuild(interaction);
		const executor = await resolveGuildExecutor(interaction, guild);

		const office = await getOfficeForMember(executor);
		if (null === office) {
			await interaction.editReply(getNoOwnedOfficePayload());
			return;
		}

		const user = interaction.options.getUser("user", true);
		const member = await guild.members.fetch(user.id);

		await member.roles.add(office.keyId);

		await interaction.editReply("Office key granted!");
	}
);

const keyRevokeSubCommand = new SlashSubCommand(
	"revoke",
	{
		description: "Revoke your office's key from someone",
		options: [
			{
				type: ApplicationCommandOptionType.User,
				name: "user",
				description: "The user to revoke the key from",
				required: true
			}
		]
	},
	async (interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply({ flags: "Ephemeral" });

		const guild = await resolveGuild(interaction);
		const executor = await resolveGuildExecutor(interaction, guild);

		const office = await getOfficeForMember(executor);
		if (null === office) {
			await interaction.editReply(getNoOwnedOfficePayload());
			return;
		}

		const user = interaction.options.getUser("user", true);
		const member = await guild.members.fetch(user.id);

		await member.roles.remove(office.keyId);

		await interaction.editReply("Office key revoked!");
	}
);

const keyRenameSubCommand = new SlashSubCommand(
	"rename",
	{
		description: "Edits the name of your office's key role",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "name",
				description: "The office's new key role name",
				required: true,
				max_length: 50
			}
		]
	},
	async (interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply({ flags: "Ephemeral" });

		const guild = await resolveGuild(interaction);
		const executor = await resolveGuildExecutor(interaction, guild);

		const office = await getOfficeForMember(executor);
		if (null === office) {
			await interaction.editReply(getNoOwnedOfficePayload());
			return;
		}

		const role = await guild.roles.fetch(office.keyId);
		if (null === role) {
			throw new Error(`Failed to fetch role with id "${office.keyId}"`);
		}

		const name = interaction.options.getString("name", true);

		await db()
			.update(offices)
			.set({
				keyName: toKeyName(name)
			})
			.where(eq(offices.officeId, office.officeId));

		await officeCache.refresh();

		await role.setName(toKeyName(name));

		await interaction.editReply("Office key name updated!");
	}
);

const keySubCommandGroup = new SlashSubCommandGroup(
	"key",
	"Manages your office's key",
	keyGrantSubCommand,
	keyRevokeSubCommand,
	keyRenameSubCommand
);

export const CommandMyOffice = new SlashCommandGroup(
	"my-office",
	{
		description: "Group of commands for managing your office",
		dmPermission: false
	},
	keyholdersSubCommand,
	renameSubCommand,
	keySubCommandGroup
);
