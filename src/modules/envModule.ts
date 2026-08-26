import { configDotenv } from "dotenv";
import { z } from "zod";
import { validate } from "@/utils/validate";

configDotenv({ quiet: true });

export const env = validate({
	COLOUR: {
		/** @see https://no-color.org/ */
		DISABLE: z.coerce.boolean().default(false),
		/** @see https://force-color.org/ */
		FORCE: z.coerce.boolean().default(false)
	},

	LOG_LEVEL: z
		.literal(["trace", "debug", "info", "warn", "error", "fatal"])
		.default("info"),
	LOG_DIR_PATH: z.string().default("logs"),

	ERROR: {
		FILES_DIR_PATH: z.string().default("errors"),

		LOCATION_RESOLUTION: z.literal(["disabled"]).default("disabled"),

		DISCORD_WEBHOOK: z
			.templateLiteral(
				["https://discord.com/api/webhooks/", z.string(), "/", z.string()],
				{
					error:
						"Invalid Discord webhook syntax " +
						'(expected format: "https://discord.com/api/webhooks/{webhook.id}/{webhook.token}")'
				}
			)
			.optional(),

		DISCORD_THREAD_ID: z
			.string()
			.regex(/^\d{17,19}$/, { error: "Invalid Discord thread id syntax" })
			.optional(),

		DISCORD_PING_ROLES_ID: z
			.string()
			.transform(val => val.split(",").map(item => item.trim()))
			.default([])
	},

	DISCORD_TOKEN: z.string().default("N/A"),
});
