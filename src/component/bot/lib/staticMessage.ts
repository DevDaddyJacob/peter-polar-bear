import type { BaseMessageOptions, Message, Snowflake } from "discord.js";
import type { DbStaticMessage } from "@/db/types.ts";
import type { Awaitable, MaybeAwaitable } from "@/utils/awaitable.ts";
import type { MaybeArray, MaybeSupplier } from "@/utils/types.ts";

import { eq } from "drizzle-orm";
import { db } from "@/db/connect.ts";
import { staticMessages } from "@/db/schema.ts";
import { app } from "@";

type Payload = BaseMessageOptions & {
	flags?: MaybeArray<"SuppressEmbeds" | "IsComponentsV2">;
};

export class StaticMessage {
	private readonly name: string;
	private readonly channelId: Snowflake;
	private readonly payload: MaybeSupplier<Payload>;

	constructor(name: string, channelId: Snowflake, payload: MaybeSupplier<Payload>) {
		this.name = name;
		this.channelId = channelId;
		this.payload = payload;
	}

	public async update(): Awaitable<Message> {
		const existingMsg = await this.tryFindExistingMessage();
		if (!existingMsg) {
			return this.create();
		}

		if (existingMsg.channelId !== this.channelId) {
			await db().delete(staticMessages).where(eq(staticMessages.name, this.name));
			return this.create();
		}

		await existingMsg.edit(await this.resolvePayload());

		return existingMsg;
	}

	private async create(): Awaitable<Message> {
		const guild = await app.discordBot.iglooGuild.get();

		const channel = await guild.channels.fetch(this.channelId);
		if (null === channel || !channel.isTextBased()) {
			throw new Error(`No such channel with ID ${this.channelId}`);
		}

		const message = await channel.send(await this.resolvePayload());

		await db().insert(staticMessages).values({
			name: this.name,
			guildId: guild.id,
			channelId: channel.id,
			messageId: message.id
		});

		return message;
	}

	private resolvePayload(): MaybeAwaitable<Payload> {
		if ("function" === typeof this.payload) {
			return this.payload();
		}

		return this.payload;
	}

	private getDBEntry(): Awaitable<DbStaticMessage | undefined> {
		return db().query.staticMessages.findFirst({
			where: {
				name: this.name
			}
		});
	}

	private async tryFindExistingMessage(): Awaitable<Message | null> {
		const dbEntry = await this.getDBEntry();
		if (undefined === dbEntry) {
			return null;
		}

		const guild = await app.discordBot.iglooGuild.get();

		const channel = await guild.channels.fetch(dbEntry.channelId);
		if (null === channel || !channel.isTextBased()) {
			return null;
		}

		const message = await channel.messages.fetch(dbEntry.messageId);
		if (null === message) {
			return null;
		}

		return message;
	}
}
