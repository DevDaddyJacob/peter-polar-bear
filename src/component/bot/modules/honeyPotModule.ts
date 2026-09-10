import type { Guild, Message } from "discord.js";
import type { PeterPolarBearBot } from "@/bot/peterPolarBear.ts";
import type { Awaitable } from "@/utils/awaitable.ts";

import { ComponentType } from "discord.js";
import { Channels } from "@/bot/constants/channels.ts";
import { Roles } from "@/bot/constants/roles.ts";
import { toLogFormat } from "@/bot/utils.ts";
import { errorReport } from "@/error/report.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";
import { assert } from "@/utils/functions.ts";
import { app } from "@";

async function ensureHoneyPotMessageExists(guild: Guild): Awaitable {
	const channel = await guild.channels.fetch(Channels.HONEY_POT);
	assert(null !== channel);
	assert(channel.isTextBased());

	const messages = await channel.messages.fetch({ limit: 100 });
	if (0 !== messages.size) {
		return;
	}

	const newMessage = await channel.send({
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

	await newMessage.pin("Static message pin");
}

export async function onEventHoneyPotMessage(this: PeterPolarBearBot, message: Message) {
	if (message.author.bot) {
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
		await ensureHoneyPotMessageExists(guild);
	} catch (err) {
		await errorReport(err as Error);
	}
}
