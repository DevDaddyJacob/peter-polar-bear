import { defineRelations } from "drizzle-orm";
import * as schema from "@/db/schema";

export const relations = defineRelations(schema, r => ({
	users: {
		offices: r.many.offices({
			from: r.users.userId,
			to: r.offices.ownerUserId
		})
	},
	offices: {
		owner: r.one.users({ optional: false })
	}
}));
