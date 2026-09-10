import {
	bigint,
	primaryKey,
	snakeCase,
	text,
	unique,
	varchar
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/utils.ts";

export const staticMessages = snakeCase.table(
	"static_messages",
	{
		staticMessageId: bigint({ mode: "bigint" })
			.generatedAlwaysAsIdentity({ cache: 50 })
			.notNull(),
		name: varchar({ length: 50 }).notNull(),
		guildId: text().notNull(),
		channelId: text().notNull(),
		messageId: text().notNull(),
		...timestamps
	},
	table => [
		primaryKey({ name: "pk_static_messages", columns: [table.staticMessageId] }),
		unique("uk_static_messages_name").on(table.name)
	]
);
