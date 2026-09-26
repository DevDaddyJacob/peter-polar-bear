import type {
	ChatInputCommandInteraction,
} from "discord.js";

import { ApplicationCommandOptionType, } from "discord.js";
import { SlashCommandGroup } from "@/lib/bot/commands/slashCommandGroup.ts";
import { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import { SlashSubCommandGroup } from "@/lib/bot/commands/slashSubCommandGroup.ts";

const keyholdersSubCommand = new SlashSubCommand(
	"keyholders",
	{
		description: "Lists all of the people with your office key"
	},
	async (interaction: ChatInputCommandInteraction) => {
		// TODO: implement
		await interaction.reply("Placeholder");
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
		// TODO: Implement
		await interaction.reply("Office updated!");
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
		// TODO: Implement
		await interaction.reply("Placeholder");
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
		// TODO: Implement
		await interaction.reply("Placeholder");
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
		// TODO: Implement
		await interaction.reply("Placeholder");
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
