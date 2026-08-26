import type {
	APIEmbed,
	APIEmbedAuthor,
	APIEmbedField,
	APIEmbedFooter,
	APIEmbedImage,
	BaseMessageOptions,
	InteractionReplyOptions,
	MessageCreateOptions
} from "discord.js";
import type { RolesType } from "@/bot/constants/roles.ts";
import type { MaybeArray } from "@/utils/types.ts";

import { EmbedType } from "discord.js";
import { Attachments } from "@/bot/constants/attachments.ts";
import { Colours } from "@/bot/constants/colours.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";

type BaseEmbedDataType = Omit<APIEmbed, "type" | "provider" | "video">;
export class BaseEmbed implements APIEmbed {
	readonly type: EmbedType = EmbedType.Rich;
	readonly title?: string = undefined;
	readonly description?: string | undefined = undefined;
	readonly url?: string | undefined = undefined;
	readonly timestamp?: string = Date.now().toString();
	readonly color?: number = Colours.BOT.BRANDING;
	readonly footer?: APIEmbedFooter | undefined = undefined;
	readonly image?: APIEmbedImage | undefined = undefined;
	readonly thumbnail?: APIEmbedImage | undefined = undefined;
	readonly author?: APIEmbedAuthor | undefined = undefined;
	readonly fields?: APIEmbedField[] | undefined = undefined;

	constructor(data?: BaseEmbedDataType) {
		this.title = data?.title;
		this.description = data?.description;
		this.url = data?.url;
		this.timestamp = data?.timestamp ?? new Date().toISOString();
		this.color = data?.color ?? Colours.BOT.BRANDING;
		this.footer = data?.footer;
		this.image = data?.image;
		this.thumbnail = data?.thumbnail;
		this.author = data?.author;
		this.fields = data?.fields;
	}

	public getFiles(): BaseMessageOptions["files"] {
		return undefined;
	}

	public getPayload(): BaseMessageOptions {
		return {
			embeds: [this],
			files: this.getFiles()
		};
	}
}

type GenericErrorEmbedDataType = Omit<BaseEmbedDataType, "color">;
export class GenericErrorEmbed extends BaseEmbed {
	public static GetGenericErrorEmbedPayload<
		T extends InteractionReplyOptions | MessageCreateOptions = InteractionReplyOptions
	>(data?: Error | GenericErrorEmbedDataType): T {
		if (data === undefined) {
			return new this().getPayload() as T;
		}

		if (data instanceof Error) {
			return new this(data).getPayload() as T;
		}

		return new this(data).getPayload() as T;
	}

	constructor();
	constructor(embedStruct: GenericErrorEmbedDataType);
	constructor(error: Error, embedStruct?: GenericErrorEmbedDataType);
	constructor(
		data?: Error | GenericErrorEmbedDataType,
		embedStruct?: GenericErrorEmbedDataType
	) {
		if (undefined !== embedStruct) {
			embedStruct = embedStruct as GenericErrorEmbedDataType;
		} else if (undefined !== data && !(data instanceof Error)) {
			embedStruct = data as GenericErrorEmbedDataType;
		} else {
			embedStruct = {} as GenericErrorEmbedDataType;
		}

		if (undefined !== data && !(data instanceof Error)) {
			data = undefined;
		} else {
			data = data as Error;
		}

		const baseData: BaseEmbedDataType = {
			title: "Zoinks Scoobs, an Error!",
			description:
				"-# Something went quite wrong to get to this point..." +
				"\nDon't worry, the development team has already been informed of this " +
				"error. In the meantime feel free to try what you were doing again.",
			color: Colours.BOT.ERROR,
			thumbnail: { url: Attachments.URLs.ERROR_ICON },
			timestamp: new Date().toISOString()
		};

		if (data instanceof Error) {
			let errorMsg = data.message;
			if (undefined !== data.stack) {
				let causeMsg = "";
				if (undefined !== data.cause) {
					causeMsg = `\n${data.cause}`;
				}

				errorMsg = `\`\`\`${data.stack}${causeMsg}\`\`\``;
			}

			baseData.description =
				"-# Something went quite wrong to get to this point...\n" +
				"The following error was unexpectedly encountered:" +
				`\n${errorMsg}`;
		}

		super({ ...baseData, ...embedStruct });
	}

	public override getFiles(): BaseMessageOptions["files"] {
		return [Attachments.ERROR_ICON];
	}
}

export class CustomErrorEmbed extends GenericErrorEmbed {
	public static GetCustomErrorEmbedPayload(title: string, message: string) {
		return new this(title, message).getPayload();
	}

	constructor(title: string, message: string) {
		super({
			title,
			description: message
		});
	}
}

type GenericWarningEmbedDataType = Omit<BaseEmbedDataType, "color">;
export class GenericWarningEmbed extends BaseEmbed {
	public static GetGenericWarningEmbedContent(data?: GenericWarningEmbedDataType) {
		return new this(data).getPayload();
	}

	constructor(embedStruct?: GenericWarningEmbedDataType) {
		const baseData: BaseEmbedDataType = {
			title: "Zoinks Scoobs, an Error!",
			description:
				"-# Something didn't quite work out to get to this point..." +
				"\nFeel free to try what you were doing again.",
			color: Colours.BOT.WARNING,
			thumbnail: { url: Attachments.URLs.WARNING_ICON },
			timestamp: new Date().toISOString()
		};

		super({ ...baseData, ...embedStruct });
	}
}

export class CustomWarningEmbed extends GenericWarningEmbed {
	public static GetCustomWarningEmbedPayload(title: string, message: string) {
		return new this(title, message).getPayload();
	}

	constructor(title: string, message: string) {
		super({
			title,
			description: message
		});
	}
}

export class PermissionWarningEmbed extends GenericWarningEmbed {
	constructor(requiredRoles: MaybeArray<RolesType>) {
		super({
			title: "Insufficient Permissions",
			description:
				`You are missing the required roles to perform this action.\n\n` +
				`You require one of the following roles:\n` +
				[...requiredRoles].map(role => `- ${DiscordFormatting.Role(role)}`).join("\n")
		});
	}
}

export class CommandErrorEmbed extends GenericErrorEmbed {
	public static GetCommandErrorEmbedPayload(data: string | Error) {
		return new this(data).getPayload();
	}

	constructor(data: string | Error) {
		const title = "Command Execution Error";
		if (data instanceof Error) {
			super(data, { title });
		} else {
			super({ title, description: data });
		}
	}
}
