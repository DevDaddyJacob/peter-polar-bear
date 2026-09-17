import { sql } from "drizzle-orm";
import { customType, uuid } from "drizzle-orm/pg-core";

export const isoDateTime = customType<{ data: Date; driverData: string }>({
	dataType() {
		return "iso_date_time";
	},
	fromDriver(value: string): Date {
		return new Date(Date.parse(value));
	},
	toDriver(value: Date): string {
		return value.toISOString();
	}
});

export const defaultUuidv7 = sql`uuidv7()`;

export const uuidv7 = <TName extends string>(name?: TName) => uuid(name);

export const updatedAt = <TName extends string>(name?: TName) =>
	isoDateTime(name ?? "updated_at")
		.notNull()
		.$default(() => new Date())
		.$onUpdate(() => new Date());

export const createdAt = <TName extends string>(name?: TName) =>
	isoDateTime(name ?? "created_at")
		.notNull()
		.$default(() => new Date());

export const timestamps = {
	updatedAt: updatedAt(),
	createdAt: createdAt()
};
