import type {
	APIMessageTopLevelComponent,
	AutocompleteInteraction,
	BaseMessageOptions,
	ButtonInteraction,
	ChatInputCommandInteraction,
	GuildMember,
	VoiceState
} from "discord.js";
import type { IndexedDbOffice } from "@/bot/lib/officeCache.ts";
import type { PeterPolarBearBot } from "@/bot/peterPolarBear.ts";
import type { DbFullOffice, NewDbOffice } from "@/db/types.ts";
import type { Awaitable } from "@/utils/awaitable.ts";
import type { KeyOf } from "@/utils/types.ts";

import { ApplicationCommandOptionType, ButtonStyle, ComponentType } from "discord.js";
import { count } from "drizzle-orm";
import { Channels } from "@/bot/constants/channels.ts";
import { Colours } from "@/bot/constants/colours.ts";
import { OfficeCache } from "@/bot/lib/officeCache.ts";
import { StaticMessage } from "@/bot/lib/staticMessage.ts";
import { resolveGuildExecutor } from "@/bot/utils.ts";
import { db } from "@/db/connect.ts";
import * as schema from "@/db/schema.ts";
import { errorReport } from "@/error/report.ts";
import { FuzzyButton } from "@/lib/bot/buttons/fuzzyButton.ts";
import { SlashCommandGroup } from "@/lib/bot/commands/slashCommandGroup.ts";
import { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";
import { assert } from "@/utils/functions.ts";
import { app } from "@";

const officeNotifyMapping = new Map<string, number>();
const OFFICE_NOTIFY_INTERVAL_MS = 5 * 60 * 1000;

export const officeCache = new OfficeCache();

export const KNOWN_OFFICES: NewDbOffice[] = [
	{
		ownerId: "194201083738980353",
		channelId: "1239197010951671920",
		officeName: "〖🐧〗ᴅᴇᴠ ᴅᴀᴅᴅʏ's ᴏғғɪᴄᴇ",
		keyId: "1239034020596285470",
		keyName: "🔑 DevJacob's Key"
	},
	{
		ownerId: "661256432838115371",
		channelId: "1239595190973501533",
		officeName: "〖☠〗ᴛᴏʀᴛᴜʀᴇ ʀᴏᴏᴍ",
		keyId: "1239595085281230848",
		keyName: "🔑 iFree's Key"
	},
	{
		ownerId: "717190806989045805",
		channelId: "1335056117696434188",
		officeName: "〖🦅〗ᴛʜᴇ ᴡʜɪᴛᴇ ʜᴏᴜsᴇ",
		keyId: "1335056114773004388",
		keyName: "🔑 US Government's Key"
	},
	{
		ownerId: "688154256762470476",
		channelId: "1317669323531091979",
		officeName: "〖🐬〗ʙʀᴏᴏᴋʟʏɴ's ᴏғғɪᴄᴇ",
		keyId: "1317669321136275528",
		keyName: "🔑 Squishy Key"
	}
];

export function getOfficeAutocompleteFunc(valueKey: KeyOf<IndexedDbOffice>) {
	return async (interaction: AutocompleteInteraction) => {
		const focused = interaction.options.getFocused();
		const query = OfficeCache.normalizeToAscii(focused);

		const searchQuery = async (q: string) => {
			if (0 === q.length) {
				return officeCache.data.slice(0, 25);
			}

			const result = await officeCache.searchByName(query, { limit: 25 });
			return result.map(r => r.item);
		};

		const results = await searchQuery(query);

		const processedResulted = results.map(o => {
			let officeName = o.officeName;
			if (100 < officeName.length) {
				officeName = `${officeName.slice(0, 97)}...`;
			}

			let value = o[valueKey];
			if (value instanceof Date) {
				value = value.toISOString();
			}

			return {
				name: officeName,
				value: value
			};
		});

		await interaction.respond(processedResulted);
	};
}

const waitingRoomStaticMessage = new StaticMessage(
	"office_waiting_room",
	Channels.OFFICES_WAITING_ROOM,
	async () => {
		const officeCmd = await app.discordBot.tryFindAppCommand(CommandOffice.name);

		let cmdString = "`/office notify`";
		if (null !== officeCmd) {
			cmdString = DiscordFormatting.SubCommand(
				officeCmd.name,
				notifySubCommand.name,
				officeCmd.id
			);
		}

		return {
			allowedMentions: {
				parse: [],
				roles: [],
				users: []
			},
			flags: "IsComponentsV2",
			components: [
				{
					type: ComponentType.Container,
					components: [
						{
							type: ComponentType.TextDisplay,
							content: "# Office Waiting Room"
						},
						{
							type: ComponentType.TextDisplay,
							content:
								`Use the ${cmdString} command to notify a office owner your waiting for them.` +
								"\nYou can only notify an office owner once every five (5) minutes."
						}
					]
				}
			]
		};
	}
);

export async function periodicOfficeWaitingRoomRefresh(): Awaitable {
	// Ensure the info message exists
	try {
		await waitingRoomStaticMessage.update();
	} catch (err) {
		await errorReport(err as Error);
	}
}

async function createOfficeDirectoryComponent(
	currentPage: number,
	numPerPage: number = 10
): Awaitable<BaseMessageOptions["components"]> {
	const makeSingleOfficeRow = (office: DbFullOffice, owner: GuildMember | null) =>
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
						`\n-# ‍     Owner: ${DiscordFormatting.User(office.owner.userId)} ` +
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
				return [o.owner.userId, await guild.members.fetch(o.owner.userId)];
			} catch {
				return [o.owner.userId, null];
			}
		})
	);

	const officeOwners: { [key: string]: GuildMember | null } =
		Object.fromEntries(officeOwnersEntries);

	const officeRows = offices.map(o =>
		makeSingleOfficeRow(o, officeOwners[o.owner.userId])
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

const notifySubCommand = new SlashSubCommand(
	"notify",
	{
		description: "Notify a office owner that your waiting for them.",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "office",
				description: "The office you're waiting for.",
				autocomplete: true,
				required: true
			}
		],
		autocomplete: getOfficeAutocompleteFunc("officeId")
	},
	async (interaction: ChatInputCommandInteraction) => {
		const selectedOfficeId = interaction.options.getString("office", true);
		const office = await officeCache.get(selectedOfficeId);
		if (null === office) {
			throw new Error(`No office found with id "${selectedOfficeId}"`);
		}

		const guild = await app.discordBot.iglooGuild.get();
		const officeChannel = await guild.channels.fetch(office.channelId);
		if (null === officeChannel || !officeChannel.isTextBased()) {
			throw new Error(`No such channel with ID ${officeChannel}`);
		}

		const executor = await resolveGuildExecutor(interaction, guild);
		if (Channels.OFFICES_WAITING_ROOM !== executor.voice.channelId) {
			await interaction.reply({
				content:
					`You must use this while in the ` +
					`${DiscordFormatting.Channel(Channels.OFFICES_WAITING_ROOM)} channel`,
				flags: "Ephemeral"
			});

			return;
		}

		const now = Date.now();
		const lastNotify = officeNotifyMapping.get(executor.id) ?? 0;
		if (lastNotify + OFFICE_NOTIFY_INTERVAL_MS > now) {
			await interaction.reply({
				content: "You are currently on a notify cooldown!",
				flags: "Ephemeral"
			});

			return;
		}

		officeNotifyMapping.set(executor.id, now);

		await officeChannel.send(
			`🔔 Attn. ${DiscordFormatting.User(office.ownerId)},` +
				`\n${DiscordFormatting.User(executor)} is in the waiting room!`
		);

		await interaction.reply({
			content: "Notification sent successfully!",
			flags: "Ephemeral"
		});
	}
);

export const CommandOffice = new SlashCommandGroup(
	"office",
	{
		description: "Group of commands for interacting with the office system",
		dmPermission: false
	},
	directorySubCommand,
	notifySubCommand
);

export async function onEventWaitingRoomJoin(
	this: PeterPolarBearBot,
	oldState: VoiceState,
	newState: VoiceState
) {
	// Ensure the user is actually joining
	if (
		Channels.OFFICES_WAITING_ROOM !== newState.channelId ||
		oldState.channelId === newState.channelId
	) {
		return;
	}

	// Ghost ping them in the VC text chat
	const guild = await app.discordBot.iglooGuild.get();

	const channel = await guild.channels.fetch(Channels.OFFICES_WAITING_ROOM);
	if (null === channel || !channel.isTextBased()) {
		throw new Error(`No such channel with ID ${channel}`);
	}

	const member = oldState.member ?? newState.member;
	assert(null !== member);

	const message = await channel.send(DiscordFormatting.User(member));
	setTimeout(async () => await message.delete(), 60 * 1000);
}
