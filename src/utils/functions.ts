import type { GuildBasedChannel, PartialGuildMember } from "discord.js";
import type { NonEmptyArray } from "@/utils/types";

import { access, lstat, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { GuildMember, Role, User } from "discord.js";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";

export function assert<T>(condition: T, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message || "Assertion failed");
	}
}

// biome-ignore lint/suspicious/noExplicitAny: N/A
export function setNestedValue(obj: any, path: NonEmptyArray<string>, value: any): any {
	// Traverse up to the second-to-last key
	const finalKey = path.at(-1);
	assert(undefined !== finalKey);

	const nestedObj = path.slice(0, -1).reduce((acc, key) => {
		// Dynamically initialize empty objects if the path doesn't exist
		if (!acc[key] || "object" !== typeof acc[key]) {
			acc[key] = {};
		}

		return acc[key];
	}, obj);

	// Set the final value
	nestedObj[finalKey] = value;
}

export function toErrorString(err: Error) {
	const name = err.name ?? err.constructor.name;
	const message = err.message;
	const stack = err.stack ?? "";

	if ("" === stack) {
		return `${name}: ${message}`;
	}

	const cleanedStack = stack.split("\n").slice(1).join("\n");

	return `${name}: ${message}\n${cleanedStack}`;
}

// Thanks Mazen and Kaspian for the idea of this geniousness
export function getFunctionCaller(
	offset = 1,
	options?: Partial<{
		useRelativePath: boolean;
	}>
): {
	methodName: string;
	rowNumber: number;
	columnNumber: number;
	fullFilePath: string;
	fileName: string;
} {
	const opts = {
		useRelativePath: false,
		// biome-ignore lint/style/noTernary: -
		...(options === undefined ? {} : options)
	};
	const err = { stack: "" };
	Error.captureStackTrace(err);

	const stackReg =
		/^ {4}at (?<method>.+) \((?<filePath>.+[\\/](?<fileName>[^: ]+)):(?<row>[0-9]+):(?<col>[0-9]+)\)/;
	const stackLines = err.stack
		.split(/\r?\n/)
		.map(line => {
			line = line.replaceAll("\\", "/");
			if (opts.useRelativePath) {
				line = line
					.replaceAll(`file:///${process.cwd().replaceAll("\\", "/")}`, ".")
					.replaceAll(`file:///${process.cwd()}`, ".")
					.replaceAll(process.cwd().replaceAll("\\", "/"), ".")
					.replaceAll(process.cwd(), ".");
			}
			return line;
		})
		.map(line => line.match(stackReg))
		.filter(line => line !== null) as RegExpMatchArray[];

	const line = stackLines[1 + offset];

	return {
		methodName: line.groups?.method as string,
		rowNumber: line.groups?.row as unknown as number,
		columnNumber: line.groups?.col as unknown as number,
		fullFilePath: line.groups?.filePath as string,
		fileName: line.groups?.fileName as string
	};
}

export async function recursiveFileSearch(folder: string) {
	const raw = await readdir(folder);

	let files: string[] = [];

	await Promise.all(
		raw.map(async r => {
			const p = join(folder, r);

			if ((await lstat(p)).isDirectory()) {
				files = files.concat(await recursiveFileSearch(p));
			} else if (r.endsWith(".js")) {
				files.push(p);
			}
		})
	);

	return files;
}

export async function ensureFolderExists(path: string) {
	const folderExists = await access(path)
		.then(() => true)
		.catch(() => false);

	if (!folderExists) {
		await mkdir(path, { recursive: true });
	}
}

export function toLogFormat(
	item: User | GuildMember | PartialGuildMember | GuildBasedChannel | Role,
	mention: boolean = false
): string {
	if (item instanceof User || item instanceof GuildMember || "user" in item) {
		if (mention) {
			return `${DiscordFormatting.User(item)} (${item.id} | ${item.displayName})`;
		}

		return `${item.displayName} (${item.id})`;
	}

	if (item instanceof Role) {
		if (mention) {
			return `${DiscordFormatting.Role(item)} (${item.id} | ${item.name})`;
		}

		return `${item.name} (${item.id})`;
	}

	if (mention) {
		return `${DiscordFormatting.Channel(item)} (${item.id} | ${item.name})`;
	}

	return `${item.name} (${item.id})`;
}
