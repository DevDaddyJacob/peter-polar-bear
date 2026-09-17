import {
	foreignKey,
	primaryKey,
	snakeCase,
	text,
	unique,
	varchar
} from "drizzle-orm/pg-core";
import { defaultUuidv7, timestamps, uuidv7 } from "@/db/utils.ts";

export const users = snakeCase.table(
	"users",
	{
		userId: uuidv7().notNull().default(defaultUuidv7),
		discordUserId: text().notNull(),
		...timestamps
	},
	t => [
		primaryKey({ name: "pk_users", columns: [t.userId] }),
		unique("uk_users_discord_user_id").on(t.discordUserId)
	]
);

export const staticMessages = snakeCase.table(
	"static_messages",
	{
		staticMessageId: uuidv7().notNull().default(defaultUuidv7),
		name: varchar({ length: 50 }).notNull(),
		guildId: text().notNull(),
		channelId: text().notNull(),
		messageId: text().notNull(),
		...timestamps
	},
	t => [
		primaryKey({ name: "pk_static_messages", columns: [t.staticMessageId] }),
		unique("uk_static_messages_name").on(t.name)
	]
);

export const offices = snakeCase.table(
	"offices",
	{
		officeId: uuidv7().notNull().default(defaultUuidv7),
		ownerUserId: uuidv7().notNull(),
		channelId: text().notNull(),
		officeName: varchar({ length: 50 }).notNull(),
		keyId: text().notNull(),
		keyName: varchar({ length: 50 }).notNull(),
		...timestamps
	},
	t => [
		primaryKey({ name: "pk_offices", columns: [t.officeId] }),
		unique("uk_offices_channel_id").on(t.channelId),
		unique("uk_offices_office_name").on(t.officeName),
		unique("uk_offices_key_id").on(t.keyId),
		unique("uk_offices_key_name").on(t.keyName),
		foreignKey({
			name: "fk_offices_owner_user_id",
			columns: [t.ownerUserId],
			foreignColumns: [users.userId]
		})
			.onDelete("cascade")
			.onUpdate("cascade")
	]
);
