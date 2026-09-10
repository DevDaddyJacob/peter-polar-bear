import { customType } from "drizzle-orm/pg-core";

export const isoDateTime = customType<{ data: Date; driverData: string }>({
	dataType() {
		return "timestamp";
	},
	fromDriver(value: string): Date {
		return new Date(Date.parse(value));
	},
	toDriver(value: Date): string {
		return value.toISOString();
	}
});

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
