import { foreignKey, primaryKey, snakeCase, unique, varchar } from "drizzle-orm/pg-core";
import { defaultUuidv7, discordSnowflake, timestamps, uuidv7 } from "@/db/utils.ts";

export const users = snakeCase.table(
	"users",
	{
		userId: discordSnowflake().notNull(),
		...timestamps
	},
	t => [primaryKey({ name: "pk_users", columns: [t.userId] })]
);

export const staticMessages = snakeCase.table(
	"static_messages",
	{
		staticMessageId: uuidv7().notNull().default(defaultUuidv7),
		name: varchar({ length: 50 }).notNull(),
		guildId: discordSnowflake().notNull(),
		channelId: discordSnowflake().notNull(),
		messageId: discordSnowflake().notNull(),
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
		ownerId: discordSnowflake().notNull(),
		channelId: discordSnowflake().notNull(),
		officeName: varchar({ length: 50 }).notNull(),
		keyId: discordSnowflake().notNull(),
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
			columns: [t.ownerId],
			foreignColumns: [users.userId]
		})
			.onDelete("cascade")
			.onUpdate("cascade")
	]
);
