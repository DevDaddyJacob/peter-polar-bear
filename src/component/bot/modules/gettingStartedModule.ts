import type { BaseMessageOptions, ButtonInteraction, Guild, Role } from "discord.js";
import type { Awaitable } from "@/utils/awaitable.ts";

import { ButtonStyle, ComponentType } from "discord.js";
import { Attachments } from "@/bot/constants/attachments.ts";
import { Channels } from "@/bot/constants/channels.ts";
import { BaseEmbed } from "@/bot/constants/embeds.ts";
import { Roles } from "@/bot/constants/roles.ts";
import { StaticMessage } from "@/bot/lib/staticMessage.ts";
import { toLogFormat } from "@/bot/utils.ts";
import { errorReport } from "@/error/report.ts";
import { Button } from "@/lib/bot/button.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";
import { assert } from "@/utils/functions.ts";
import { app } from "@";

class GettingStartedEmbed extends BaseEmbed {
	public static GetEmbedPayload() {
		return new this().getPayload();
	}

	constructor() {
		const rulesChannel = DiscordFormatting.Channel(Channels.RULES);
		const infoChannel = DiscordFormatting.Channel(Channels.INFORMATION);

		super({
			title: "The Igloo Bouncer",
			description:
				`Once you've read through ${rulesChannel} and ${infoChannel} ` +
				"click the button attached to this message to get your additional roles!",
			thumbnail: { url: Attachments.URLs.DISCORD_ICON }
		});
	}

	public override getFiles(): BaseMessageOptions["files"] {
		return [Attachments.DISCORD_ICON];
	}
}

const gettingStartedStaticMessage = new StaticMessage(
	"getting_started",
	Channels.GETTING_STARTED,
	{
		...GettingStartedEmbed.GetEmbedPayload(),
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.Button,
						custom_id: "getting-started",
						label: "Get Started",
						style: ButtonStyle.Primary
					}
				]
			}
		]
	}
);

async function ensureMessageExists(): Awaitable {
	const message = await gettingStartedStaticMessage.update();

	if (!message.pinned) {
		await message.pin("Static message pin");
	}
}

async function scanMemberRoles(guild: Guild): Awaitable {
	const rankRoles = [
		Roles.DEV_DADDY,
		Roles.CULT_HIGH_COUNCIL,
		Roles.CULT_BOARD_MEMBER,
		Roles.CULT_MINISTER,
		Roles.CULT_ENFORCER,
		Roles.CULT_INQUISITOR,
		Roles.CULT_DISCIPLE,
		Roles.CULT_PROSPECT
	];

	const baseRole = await guild.roles.fetch(Roles.WILDERNESS_EXPLORER);
	assert(null !== baseRole);

	const rankRole = await guild.roles.fetch(Roles.CULT_PROSPECT);
	assert(null !== rankRole);

	const members = await guild.members.fetch();

	const filteredMembers = members
		.map(member => {
			if (0 === member.roles.cache.size) {
				return member;
			}

			if (!member.roles.cache.has(baseRole.id)) {
				return member;
			}

			if (!member.roles.cache.hasAny(...rankRoles)) {
				return member;
			}

			return null;
		})
		.filter(val => null !== val);

	const allTasks = filteredMembers.map(async member => {
		const added: Role[] = [];

		if (0 === member.roles.cache.size) {
			await member.roles.add([baseRole, rankRole]);
			added.push(baseRole, rankRole);
		}

		if (!member.roles.cache.has(baseRole.id)) {
			await member.roles.add(baseRole.id);
			added.push(baseRole);
		}

		if (!member.roles.cache.hasAny(...rankRoles)) {
			await member.roles.add(rankRole.id);
			added.push(rankRole);
		}

		const rolesFormatted = added.map(role => toLogFormat(role));

		await app.discordBot.discordLog(
			`added role(s) ${rolesFormatted.join(", ")} ` +
				`to user ${toLogFormat(member, true)}`
		);
	});

	await Promise.allSettled(allTasks);
}

export async function periodicGettingStartedScan(): Awaitable {
	const guild = await app.discordBot.iglooGuild.get();

	// Ensure the message exists
	try {
		await ensureMessageExists();
	} catch (err) {
		await errorReport(err as Error);
	}

	// Check all members for missing roles
	try {
		await scanMemberRoles(guild);
	} catch (err) {
		await errorReport(err as Error);
	}
}

export const GettingStartedButton = new Button(
	"getting-started",
	async (interaction: ButtonInteraction) => {
		assert(null !== interaction.guild);

		await interaction.reply({
			content: "Welcome aboard!",
			flags: "Ephemeral"
		});

		const executor = await interaction.guild.members.fetch(interaction.user.id);
		await executor.roles.add([Roles.WILDERNESS_EXPLORER, Roles.CULT_PROSPECT]);
	}
);
