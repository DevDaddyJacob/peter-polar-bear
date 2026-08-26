require("dotenv").config();
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "mysql",
	schema: "./src/packages/database/schema.ts",
	out: "./drizzle",
	verbose: true,
	dbCredentials: {
		host: process.env.DB_HOST ?? "",
		user: process.env.DB_USER ?? "",
		password: process.env.DB_PASSWORD ?? "",
		database: process.env.DB_DATABASE ?? "",
		port: parseInt(process.env.DB_PORT ?? "5432")
	}
});
