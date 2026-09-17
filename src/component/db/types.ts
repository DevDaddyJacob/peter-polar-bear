import type * as schema from "@/db/schema";

export type NewDBUser = typeof schema.users.$inferInsert;
export type DBUser = typeof schema.users.$inferSelect;

export type NewDBStaticMessage = typeof schema.staticMessages.$inferInsert;
export type DBStaticMessage = typeof schema.staticMessages.$inferSelect;

export type NewDBOffice = typeof schema.offices.$inferInsert;
export type DBOffice = typeof schema.offices.$inferSelect;
export type DBFullOffice = DBOffice & {
	owner: DBUser;
};
