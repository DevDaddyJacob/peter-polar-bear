import type {
	APIMessageTopLevelComponent,
	BaseMessageOptions,
	ButtonInteraction,
	ChatInputCommandInteraction,
	GuildMember
} from "discord.js";
import type { DBFullOffice, } from "@/db/types.ts";
import type { Awaitable } from "@/utils/awaitable.ts";

import { ButtonStyle, ComponentType } from "discord.js";
import { count } from "drizzle-orm";
import { Colours } from "@/bot/constants/colours.ts";
import { db } from "@/db/connect.ts";
import * as schema from "@/db/schema.ts";
import { FuzzyButton } from "@/lib/bot/buttons/fuzzyButton.ts";
import { SlashCommandGroup } from "@/lib/bot/commands/slashCommandGroup.ts";
import { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";
import { app } from "@";

async function createOfficeDirectoryComponent(
	currentPage: number,
	numPerPage: number = 10
): Awaitable<BaseMessageOptions["components"]> {
	const makeSingleOfficeRow = (office: DBFullOffice, owner: GuildMember | null) =>
		({
			type: ComponentType.Section,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: office.officeName
				},
				{
					type: ComponentType.TextDisplay,
					content:
						`-# ‍     Key: ${office.keyName}` +
						`\n-# ‍     Owner: ${DiscordFormatting.User(office.owner.discordUserId)} ` +
						`(${owner?.displayName ?? "unknown"})`
				}
			],
			accessory: {
				type: ComponentType.Button,
				style: ButtonStyle.Secondary,
				custom_id: `office_directory_info_${office.officeId}`,
				emoji: "ℹ️"
			}
		}) as APIMessageTopLevelComponent;

	const startOffset = numPerPage * (currentPage - 1);
	const totalOffices = await db().select({ count: count() }).from(schema.offices);
	const maxPages = Math.ceil(totalOffices[0].count / numPerPage);

	const offices = await db().query.offices.findMany({
		limit: numPerPage,
		offset: startOffset,
		orderBy: {
			createdAt: "desc"
		},
		with: {
			owner: true
		}
	});

	const guild = await app.discordBot.iglooGuild.get();
	const officeOwnersEntries = await Promise.all(
		offices.map(async o => {
			try {
				return [o.owner.discordUserId, await guild.members.fetch(o.owner.discordUserId)];
			} catch {
				return [o.owner.discordUserId, null];
			}
		})
	);

	const officeOwners: { [key: string]: GuildMember | null } =
		Object.fromEntries(officeOwnersEntries);

	const officeRows = offices.map(o =>
		makeSingleOfficeRow(o, officeOwners[o.owner.discordUserId])
	);

	const previousButton = {
		type: ComponentType.Button,
		style: ButtonStyle.Success,
		custom_id: `office_directory_page_${currentPage - 1}`,
		disabled: false,
		emoji: "⏮️"
	};

	if (1 === currentPage) {
		previousButton.disabled = true;
		previousButton.style = ButtonStyle.Danger;
	}

	const nextButton = {
		type: ComponentType.Button,
		style: ButtonStyle.Success,
		custom_id: `office_directory_page_${currentPage + 1}`,
		disabled: false,
		emoji: "⏭️"
	};

	if (maxPages === currentPage) {
		nextButton.disabled = true;
		nextButton.style = ButtonStyle.Danger;
	}

	return [
		{
			type: ComponentType.Container,
			accent_color: Colours.BOT.BRANDING,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `# 🏢 Office Directory\n-# Page ${currentPage} of ${maxPages}`
				},
				{
					type: ComponentType.Separator,
					divider: true,
					spacing: 1
				},
				...officeRows
			]
		},
		{
			type: ComponentType.ActionRow,
			components: [previousButton, nextButton]
		}
	];
}

const directorySubCommand = new SlashSubCommand(
	"directory",
	{
		description: "Lists all of the offices, their name, key and owner"
	},
	async (interaction: ChatInputCommandInteraction) => {
		await interaction.reply({
			allowedMentions: {
				parse: [],
				roles: [],
				users: []
			},
			components: await createOfficeDirectoryComponent(1),
			flags: ["IsComponentsV2"]
		});
	}
);

export const OfficeDirectoryNavButton = new FuzzyButton(
	"office_directory_page_",
	"startsWith",
	async (interaction: ButtonInteraction) => {
		await interaction.deferReply({ flags: "Ephemeral" });

		const pageRaw = interaction.customId.slice(22);
		const page = Number.parseInt(pageRaw);

		await interaction.message.edit({
			allowedMentions: {
				parse: [],
				roles: [],
				users: []
			},
			components: await createOfficeDirectoryComponent(page),
			flags: ["IsComponentsV2"]
		});

		await interaction.deleteReply();
	}
);

export const CommandOffice = new SlashCommandGroup(
	"office",
	{
		description: "Group of commands for interacting with the office system",
		dmPermission: false
	},
	directorySubCommand
);
