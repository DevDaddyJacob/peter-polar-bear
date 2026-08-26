import type { AttachmentPayload, BufferResolvable } from "discord.js";

import { readFileSync } from "node:fs";
import { asset } from "@/codegen/assets.codegen.ts";

export type AttachmentLikeUrl<FileName extends string = string> =
	`attachment://${FileName}`;

type AttachmentFiles = keyof typeof Attachments.Files;
type AttachmentMap<Value> = {
	[File in AttachmentFiles]?: Value;
};

// biome-ignore lint/complexity/noStaticOnlyClass: -
export class Attachments {
	private static _CACHED_BUFFERS: AttachmentMap<BufferResolvable> = {};
	private static _CACHED_PAYLOADS: AttachmentMap<AttachmentPayload> = {};

	public static readonly Files = {
		ERROR_ICON: "errorIcon.png",
		WARNING_ICON: "warningIcon.png",
	} as const;

	public static readonly URLs = {
		ERROR_ICON: Attachments.makeUrl(Attachments.Files.ERROR_ICON),
		WARNING_ICON: Attachments.makeUrl(Attachments.Files.WARNING_ICON),
	} as const;

	public static get ERROR_ICON(): AttachmentPayload {
		return Attachments.getCachedPayload("ERROR_ICON");
	}

	public static get WARNING_ICON(): AttachmentPayload {
		return Attachments.getCachedPayload("WARNING_ICON");
	}

	private static getCachedStream(key: AttachmentFiles): BufferResolvable {
		if (Attachments._CACHED_BUFFERS[key] !== undefined) {
			return Attachments._CACHED_BUFFERS[key];
		}

		Attachments._CACHED_BUFFERS[key] = readFileSync(asset(Attachments.Files[key]));
		return Attachments._CACHED_BUFFERS[key];
	}

	private static getCachedPayload(key: AttachmentFiles): AttachmentPayload {
		if (Attachments._CACHED_PAYLOADS[key] !== undefined) {
			return Attachments._CACHED_PAYLOADS[key];
		}

		Attachments._CACHED_PAYLOADS[key] = {
			attachment: Attachments.getCachedStream(key),
			name: Attachments.Files[key],
			description: Attachments.Files[key]
		};
		return Attachments._CACHED_PAYLOADS[key];
	}

	private static makeUrl<F extends string>(file: F): AttachmentLikeUrl<F> {
		return `attachment://${file}`;
	}
}
