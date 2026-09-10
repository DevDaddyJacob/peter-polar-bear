import type * as schema from "@/db/schema";

export type NewStaticMessage = typeof schema.staticMessages.$inferInsert;
export type StaticMessage = typeof schema.staticMessages.$inferSelect;
