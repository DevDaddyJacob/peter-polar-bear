import type * as schema from "@/db/schema";

export type NewDBStaticMessage = typeof schema.staticMessages.$inferInsert;
export type DBStaticMessage = typeof schema.staticMessages.$inferSelect;
