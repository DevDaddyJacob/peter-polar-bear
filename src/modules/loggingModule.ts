import type { DestinationStream, Level } from "pino";

import { readFileSync } from "node:fs";
import { format } from "node:util";
import pino from "pino";
import { env } from "@/modules/envModule.ts";
import { colour } from "@/utils/colour.ts";
import { rotatingFileSink } from "@/utils/rotatingFileSink.ts";
import { asset } from "../codegen/assets.codegen.ts";

const ANSI_SGR = /\x1b\[[0-9;]*m/g;
const MAX_LEVEL_LABEL_LENGTH =
	Object.values(pino.levels.labels)
		.map(l => l.length)
		.sort()
		.reverse()
		.at(0) ?? 5;

function formatTimestamp(style: "full" | "short", ms: number) {
	const date = new Date(ms);

	const time = format(
		"%s:%s:%s.%s",
		date.getHours().toString().padStart(2, "0"),
		date.getMinutes().toString().padStart(2, "0"),
		date.getSeconds().toString().padStart(2, "0"),
		date.getMilliseconds().toString().padStart(3, "0")
	);

	if ("short" === style) {
		return time;
	}

	const offsetTime = -1 * date.getTimezoneOffset();
	// biome-ignore lint/style/noTernary: Acceptable poison
	const offsetSign = 0 <= offsetTime ? "+" : "-";
	const absOffset = Math.abs(offsetTime);

	const offset = format(
		"%s%s%s",
		offsetSign,
		Math.floor(absOffset / 60)
			.toString()
			.padStart(2, "0"),
		(absOffset % 60).toString().padStart(2, "0")
	);

	const dateMonthYear = format(
		"%s-%s-%s",
		date.getFullYear(),
		(date.getMonth() + 1).toString().padStart(2, "0"),
		date.getDate().toString().padStart(2, "0")
	);

	return format("%sT%s%s", dateMonthYear, time, offset);
}

function getColourForLogLevel(level: Level | string): Parameters<typeof colour>[0] {
	switch (level) {
		case "trace": {
			return "WHITE_FG";
		}

		case "debug": {
			return "DEFAULT_FG";
		}

		case "info": {
			return "BLUE_FG";
		}

		case "warn": {
			return ["BOLD", "YELLOW_FG"];
		}

		case "error":
		case "fatal": {
			return "RED_FG";
		}

		default: {
			return "DEFAULT_FG";
		}
	}
}

interface FormatOptions {
	moduleWidth: number;
	time: "full" | "short";
	color: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: Needed for pino sake?
function formatLine(obj: any, opts: FormatOptions): string {
	const timestamp = formatTimestamp(opts.time, obj.time);
	const level = pino.levels.labels[obj.level];
	const module = String(obj.module ?? "");

	const levelField = level.toUpperCase().padStart(MAX_LEVEL_LABEL_LENGTH);
	const moduleField = module.padStart(opts.moduleWidth).slice(0, opts.moduleWidth);

	if (!opts.color) {
		return format(
			"%s %s %s : %s\n",
			timestamp,
			levelField,
			moduleField,
			obj.msg ?? ""
		).replace(ANSI_SGR, "");
	}

	return format(
		"%s %s %s : %s\n",
		colour("WHITE_FG", timestamp),
		colour(getColourForLogLevel(level), levelField),
		colour("CYAN_FG", moduleField),
		obj.msg ?? ""
	);
}

// Wrap a sink so multistream (which hands us serialized JSON) emits our layout.
function formatted(
	sink: { write(s: string): unknown },
	opts: FormatOptions
): DestinationStream {
	return {
		write(chunk: string) {
			// biome-ignore lint/suspicious/noExplicitAny: Pino required?
			let obj: any;
			try {
				obj = JSON.parse(chunk);
			} catch {
				sink.write(chunk);
				return;
			}
			sink.write(formatLine(obj, opts));
		}
	} as DestinationStream;
}

function useColour() {
	if (env.COLOUR.FORCE) {
		return true;
	}

	if (env.COLOUR.DISABLE) {
		return false;
	}

	return process.stdout.isTTY;
}

function readBannerText(): string {
	try {
		return readFileSync(asset(".banner"), "utf8")
			.replaceAll("\\x1b", "\u001B")
			.replaceAll("%APP_ENV%", APP_ENV ?? "-")
			.replaceAll("%APP_VERSION%", APP_VERSION ?? "-")
			.replaceAll("%BUILD_TIMESTAMP%", BUILD_TIMESTAMP ?? "-")
			.replaceAll("%GIT_COMMIT_HASH%", GIT_COMMIT_HASH ?? "-");
	} catch (e) {
		console.error(e);
		return "";
	}
}

export function printBanner(): void {
	let text = readBannerText();
	if (0 === text.length) {
		return;
	}

	if (!useColour()) {
		text = text.replace(ANSI_SGR, "");
	}

	if (!text.endsWith("\n")) {
		text += "\n";
	}

	process.stdout.write(text);
}

const streams = [
	{
		level: "trace",
		stream: formatted(
			rotatingFileSink({ dir: env.LOG_DIR_PATH, base: "current", ext: ".trace" }),
			{ moduleWidth: 20, time: "full", color: false }
		)
	},
	{
		level: "info",
		stream: formatted(
			rotatingFileSink({ dir: env.LOG_DIR_PATH, base: "current", ext: ".log" }),
			{ moduleWidth: 15, time: "full", color: false }
		)
	},
	{
		level: env.LOG_LEVEL,
		stream: formatted(process.stdout, {
			moduleWidth: 15,
			time: "short",
			color: useColour()
		})
	}
];

const root = pino({ level: "trace" }, pino.multistream(streams));

function moduleLogger(moduleName: string) {
	return root.child({ module: moduleName });
}

export const appLogger = moduleLogger("Application");
export const botLogger = moduleLogger("Discord");
export const errorModuleLogger = moduleLogger("ErrorHandler");
export const gitlabLogger = moduleLogger("GitLab");
