import type { Awaitable } from "@/utils/awaitable.ts";

import { ComponentType } from "discord.js";
import { Channels } from "@/bot/constants/channels.ts";
import { StaticMessage } from "@/bot/lib/staticMessage.ts";
import { errorReport } from "@/error/report.ts";
import { app } from "@";

const infoStaticMessage = new StaticMessage("info", Channels.INFORMATION, {
	allowedMentions: {
		parse: [],
		roles: [],
		users: []
	},
	flags: "IsComponentsV2",
	components: [
		{
			type: ComponentType.TextDisplay,
			content: "# Igloo Information"
		},
		{
			type: ComponentType.TextDisplay,
			content:
				"Welcome to **[The Igloo](<https://discord.devjacob.com/>)**!\n\n" +
				"This Discord is owned by <@194201083738980353> and used as a hangout " +
				"ground for friends from all aspects of life and online gaming.\n\n" +
				"This channel will aim to provide you with the necessary information " +
				"for you to get a grasp of what is what around here."
		},
		{
			type: ComponentType.Separator,
			spacing: 2,
			divider: true
		},
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: "## Our Roles"
				},
				{
					type: ComponentType.TextDisplay,
					content:
						"There are various roles within our Discord, most have some " +
						"level of significance to them, but some are also just here " +
						"for show. This section will briefly go over each of the more " +
						"prominent roles and their purpose.\n\n\n" +
						"**Administrative Roles** - These are roles which actually manage the server, and would be your go to people if you encounter problems.\n" +
						"- <@&1239029083338313808> This is a role reserved for <@194201083738980353>\n" +
						"- <@&1542234450606432398> This is the highest non-owner administrative rank\n" +
						"- <@&1542234318712344738> This is the second administrative rank\n" +
						"- <@&1542233495605223534> This is the first administrative rank\n\n\n" +
						"**Member Roles** - These are roles which are just for show and don't have a real significance to them. Usually given to closer friends.\n" +
						"- <@&1239034136606543882>\n" +
						"- <@&1254959397956878427>\n" +
						"- <@&1335643563928846404>\n" +
						"- <@&1239195532904370206>\n" +
						"- <@&1542251092543414292> *Everyone has this one*\n\n\n" +
						"**Optional Roles** - These are *some* of the optional roles which you can pick up. \n" +
						"- <@&1542246726914809967> Grants you access to <#1542246481761800323>\n" +
						"- <@&1239588880978804767> See <#1239590385165012992> for more info\n" +
						"- <@&1239668779693117510> See <#1239590385165012992> for more info"
				}
			]
		},
		{
			type: ComponentType.Separator,
			spacing: 2,
			divider: true
		},
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: "## Our Channels"
				},
				{
					type: ComponentType.TextDisplay,
					content:
						"A lot of our channels are fairly self explanatory, or " +
						"explained in the channel's topic, however this section will " +
						"highlight a few notable ones.\n\n" +
						"- <#1542241820698742845> This channel is effectively a trap against bots, **anyone** who posts any message in there will be banned\n" +
						"- <#1239590385165012992> This channel is where you can go to pickup most of the optional roles\n" +
						"- <#1239668475140509777> This channel is where we share information of some of our content creators here as well as post when they're live\n" +
						"- <#1542246481761800323> This channel is effectively public shaming those who FAFO\n" +
						"- <#1334616054042984481> This channel is the AFK channel"
				}
			]
		}
	]
});

async function ensureInfoMessageExists(): Awaitable {
	const message = await infoStaticMessage.update();

	if (!message.pinned) {
		await message.pin("Static message pin");
	}
}

export async function periodicRulesAndInfoRefresh(): Awaitable {
	const guild = await app.discordBot.iglooGuild.get();

	// Ensure the info message exists
	try {
		await ensureInfoMessageExists();
	} catch (err) {
		await errorReport(err as Error);
	}
}
