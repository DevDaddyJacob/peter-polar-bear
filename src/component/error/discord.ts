import type { GuildMember, GuildTextBasedChannel, Interaction, User } from "discord.js";
import type { PartialErrorReportOptions } from "@/error/report.ts";
import type { Awaitable } from "@/utils/awaitable.ts";

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { MessageFlagsBitField } from "discord.js";
import { getFullCommandName, toLogFormat } from "@/bot/utils.ts";
import { ERROR_ENV_CONFIG } from "@/error/config.ts";
import { parseOptions } from "@/error/report.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";
import { UnixTime } from "@/utils/unixTime.ts";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: fix this
export async function sendToDiscord<T extends Error>(
	error: T,
	options?: PartialErrorReportOptions,
	fileData?: { uuid: string; path: string }
): Awaitable {
	if (!ERROR_ENV_CONFIG.discordReporting.enabled) {
		return;
	}

	const opts = parseOptions(options);
	if (!opts.discordOptions.targeted) {
		return;
	}

	// Build the message
	const entries = Object.entries(opts.metadata ?? {});
	const dataPairs = [
		["Timestamp", `${UnixTime.longDateTime()} (${UnixTime.relativeTime()})`]
	];

	if (fileData !== undefined) {
		dataPairs.push(["UUID", fileData.uuid]);
	}

	for (const [key, value] of entries) {
		switch (key) {
			case "discordInteraction": {
				const _interaction = <Interaction>value;
				dataPairs.push(["Interaction ID", _interaction.id]);

				if (_interaction.isCommand()) {
					dataPairs.push(["Command Name", getFullCommandName(_interaction)]);
					dataPairs.push(["Command ID", _interaction.commandId]);
				}

				break;
			}

			case "discordUser": {
				dataPairs.push(["User", toLogFormat(<User | GuildMember>value, true)]);
				break;
			}

			case "discordExecutor": {
				dataPairs.push(["Executor User", toLogFormat(<User | GuildMember>value, true)]);
				break;
			}

			case "discordTarget": {
				dataPairs.push(["Target User", toLogFormat(<User | GuildMember>value, true)]);
				break;
			}

			case "discordChannel": {
				dataPairs.push(["Channel", toLogFormat(<GuildTextBasedChannel>value, true)]);
				break;
			}

			default: {
				if (
					"function" === typeof value &&
					"undefined" === typeof value &&
					"symbol" === typeof value
				) {
					break;
				}

				if ("object" === typeof value) {
					if (undefined !== value?.toString) {
						dataPairs.push([key, value.toString()]);
						break;
					}

					dataPairs.push([key, JSON.stringify(value)]);
					break;
				}

				dataPairs.push([key, value]);
				break;
			}
		}
	}

	const formattedData = dataPairs.map(pair => `__${pair[0]}__ ${pair[1]}`).join("\n");

	let messageStarter = "";
	if (opts.discordOptions.includePing) {
		const roles = ERROR_ENV_CONFIG.discordReporting.roleIds
			.map(roleId => DiscordFormatting.Role(roleId))
			.join(" ")
			.trim();

		if ("" !== roles) {
			messageStarter = `-# ${roles}\n`;
		}
	}

	const message = `${messageStarter}## Automated Error Report\n${formattedData}\n`;

	const remainingChars = 2000 - message.length - 6;

	let stack = `${error.name}: ${error.message}\n${error.stack?.toString() ?? "Unknown"}`;
	if (stack.length > remainingChars) {
		stack = stack.slice(0, remainingChars);
	}

	const builtMessage = `${message}\`\`\`${stack}\`\`\``;

	let flags = MessageFlagsBitField.Flags.SuppressEmbeds;
	if (opts.discordOptions.suppressPings) {
		flags &= MessageFlagsBitField.Flags.SuppressNotifications;
	}

	// biome-ignore lint/suspicious/noExplicitAny: -
	const requestBody: any = {
		username: "Automated Error Report",
		avatar_url: "https://i.imgur.com/McdlMmc.png",
		content: builtMessage,
		flags
	};

	let webhookUrl = ERROR_ENV_CONFIG.discordReporting.webhook;
	if (undefined !== ERROR_ENV_CONFIG.discordReporting.threadId) {
		webhookUrl += `?thread_id=${ERROR_ENV_CONFIG.discordReporting.threadId}`;
	}

	if (undefined === fileData) {
		await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestBody)
		});

		return;
	}

	const form = new FormData();
	form.append("payload_json", JSON.stringify(requestBody));
	form.append(
		"files[0]",
		new Blob([await readFile(fileData.path)]),
		basename(fileData.path)
	);

	await fetch(webhookUrl, {
		method: "POST",
		body: form
	});
}
