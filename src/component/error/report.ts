import type {
	BaseInteraction,
	GuildBasedChannel,
	GuildMember,
	Interaction,
	User
} from "discord.js";
import type { Level, Logger } from "pino";
import type { Awaitable } from "@/utils/awaitable.ts";
import type { DeepPartial } from "@/utils/types.ts";

import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ERROR_ENV_CONFIG } from "@/error/config.ts";
import { sendToDiscord } from "@/error/discord.ts";
import { getErrorLocation } from "@/error/location.ts";
import { getDeepStackTrace, readErrorStackDetails } from "@/error/utils.ts";
import { errorModuleLogger } from "@/modules/loggingModule.ts";
import { ensureFolderExists, toErrorString } from "@/utils/functions.ts";
import { jsonReplacer, jsonStringify } from "@/utils/stringify.ts";

export interface ErrorReportOptions {
	recordToFile: boolean;
	console:
		| {
				print: true;
				level: Level;
				logger: Logger;
		  }
		| {
				print: false;
				level: undefined;
				logger: undefined;
		  };
	discordOptions: {
		targeted: boolean;
		includePing: boolean;
		suppressPings: boolean;
		uploadFile: boolean;
	};
	metadata?: {
		// biome-ignore lint/suspicious/noExplicitAny: -
		[key: string]: any;
		discordInteraction?: Interaction | BaseInteraction;
		discordUser?: User | GuildMember;
		discordExecutor?: User | GuildMember;
		discordTarget?: User | GuildMember;
		discordChannel?: GuildBasedChannel;
	};
}

export type PartialErrorReportOptions = DeepPartial<ErrorReportOptions>;

const DEFAULT_ERROR_REPORT_OPTIONS: ErrorReportOptions = {
	recordToFile: true,
	console: {
		print: true,
		level: "error",
		logger: errorModuleLogger
	},
	discordOptions: {
		targeted: true,
		includePing: true,
		suppressPings: false,
		uploadFile: true
	}
};

export function parseOptions(
	options: PartialErrorReportOptions = {}
): ErrorReportOptions {
	return {
		...DEFAULT_ERROR_REPORT_OPTIONS,
		...options,
		console: {
			...DEFAULT_ERROR_REPORT_OPTIONS.console,
			...options?.console
		} as ErrorReportOptions["console"],
		discordOptions: {
			...DEFAULT_ERROR_REPORT_OPTIONS.discordOptions,
			...options?.discordOptions
		}
	};
}

async function recordToFile<T extends Error>(
	error: T,
	options?: PartialErrorReportOptions
): Promise<{ uuid: string; path: string }> {
	const opts = parseOptions(options);
	const uuid = randomUUID({ disableEntropyCache: true });

	// Check if the folder exists, and create it if it doesn't
	await ensureFolderExists(ERROR_ENV_CONFIG.filesDirPath);

	// Create the body of the file
	const lines: string[] = [];
	lines.push(`========== ${new Date().toISOString()} - ${uuid} ==========`);
	lines.push(`\n===== FULL STACK TRACE =====`);
	lines.push(getDeepStackTrace(error));
	lines.push(`\n===== ERROR LOCATION =====`);

	const stackLines = readErrorStackDetails(error, { useRelativePath: false });
	let errorLocation: string | null = null;
	for (const stackLine of stackLines) {
		// biome-ignore lint/performance/noAwaitInLoops: -
		errorLocation = await getErrorLocation(stackLine);
		if (errorLocation !== null) {
			break;
		}
	}

	lines.push(`${errorLocation}`);
	lines.push(`\n===== REPORT OPTIONS =====`);
	lines.push(jsonStringify(opts, jsonReplacer, 4));

	// Write to the file
	const path = join(ERROR_ENV_CONFIG.filesDirPath, `${uuid}.txt`);
	await writeFile(path, lines.join("\n"));

	return { uuid, path };
}

export async function errorReport<T extends Error>(
	error: T,
	options?: PartialErrorReportOptions
): Awaitable {
	const opts = parseOptions(options);

	let fileData: Awaited<ReturnType<typeof recordToFile>> | undefined;
	if (opts.recordToFile) {
		try {
			fileData = await recordToFile(error, opts);
		} catch (e) {
			console.error(e);
		}
	}

	if (opts.discordOptions.targeted) {
		await sendToDiscord(error, opts, fileData);
	}

	if (opts.console.print) {
		opts.console.logger[opts.console.level](toErrorString(error));
	}

	if (undefined !== fileData) {
		await rm(fileData.path);
	}
}
