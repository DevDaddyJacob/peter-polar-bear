import type { Message } from "discord.js";
import type { PeterPolarBearBot } from "@/bot/peterPolarBear.ts";
import type { Awaitable } from "@/utils/awaitable.ts";

import { ComponentType } from "discord.js";
import { Channels } from "@/bot/constants/channels.ts";
import { Roles } from "@/bot/constants/roles.ts";
import { StaticMessage } from "@/bot/lib/staticMessage.ts";
import { toLogFormat } from "@/bot/utils.ts";
import { errorReport } from "@/error/report.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";
import { assert } from "@/utils/functions.ts";
import { app } from "@";

const honeyPotStaticMessage = new StaticMessage("honey_pot", Channels.HONEY_POT, {
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
					content: "# 🍯 Honey Pot 🐝"
				},
				{
					type: ComponentType.TextDisplay,
					content:
						"Any message sent in this channel **will** result in your " +
						"automatic ban. Don't be an idiot..."
				}
			]
		}
	]
});

async function ensureHoneyPotMessageExists(): Awaitable {
	const message = await honeyPotStaticMessage.update();

	if (!message.pinned) {
		await message.pin("Static message pin");
	}
}

export async function onEventHoneyPotMessage(this: PeterPolarBearBot, message: Message) {
	if (message.author.bot) {
		return;
	}

	if (Channels.OFFENDER_REGISTRY !== message.channelId) {
		return;
	}

	await message.delete();

	const guild = await this.iglooGuild.get();
	const member = await guild.members.fetch(message.author.id);

	try {
		const registryChannel = await guild.channels.fetch(Channels.OFFENDER_REGISTRY);
		assert(null !== registryChannel);
		assert(registryChannel.isTextBased());

		await registryChannel.send(
			`${DiscordFormatting.Role(Roles.EXECUTIONERS_AUDIENCE)}\n` +
				`x1 honey pot victim: ${toLogFormat(member)}`
		);
	} catch (err) {
		await errorReport(err as Error, {
			metadata: {
				function: "onEventHoneyPotMessage",
				message: message.toJSON()
			}
		});
	}

	await member.ban({
		deleteMessageSeconds: 604800,
		reason: "Honey pot victim"
	});
}

export async function periodicHoneyPotRefresh(): Awaitable {
	const guild = await app.discordBot.iglooGuild.get();

	// Ensure the info message exists
	try {
		await ensureHoneyPotMessageExists();
	} catch (err) {
		await errorReport(err as Error);
	}
}
