import type { NonEmptyArray } from "@/utils/types";

import { access, lstat, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

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

function getErrorFrames(err: Error): string {
	const lines = (err.stack ?? "").split("\n");

	const i = lines.findIndex(line => /^\s*at\s/.test(line));

	if (-1 === i) {
		return "";
	}

	return lines.slice(i).join("\n");
}

function toErrorStringInternal(err: unknown, indent = "") {
	if (!(err instanceof Error)) {
		return indent + Bun.inspect(err);
	}

	const name = err.name || err.constructor?.name || "Error";
	const parts = [`${name}: ${err.message}`];

	const extras = Object.keys(err).filter(
		key => !["name", "message", "stack", "cause", "errors"].includes(key)
	);

	for (const key of extras) {
		// biome-ignore lint/suspicious/noExplicitAny: -
		parts.push(`  ${key}: ${Bun.inspect((err as any)[key])}`);
	}

	const frames = getErrorFrames(err);
	if (undefined !== frames) {
		parts.push(frames);
	}

	if (err instanceof AggregateError) {
		for (const nestedErr of err.errors) {
			parts.push(`\n  [aggregated]\n${toErrorStringInternal(nestedErr, `${indent}  `)}`);
		}
	} else if (err.cause !== undefined) {
		parts.push(
			`\n  [cause]: ${toErrorStringInternal(err.cause, `${indent}  `).trimStart()}`
		);
	}

	return parts.map(part => indent + part).join("\n");
}

export function toErrorString(err: unknown) {
	return toErrorStringInternal(err);
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
