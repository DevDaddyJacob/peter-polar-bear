import type * as schema from "@/db/schema";

export type NewDbUser = typeof schema.users.$inferInsert;
export type DbUser = typeof schema.users.$inferSelect;

export type NewDbStaticMessage = typeof schema.staticMessages.$inferInsert;
export type DbStaticMessage = typeof schema.staticMessages.$inferSelect;

export type NewDbOffice = typeof schema.offices.$inferInsert;
export type DbOffice = typeof schema.offices.$inferSelect;
export type DbFullOffice = DbOffice & {
	owner: DbUser;
};
