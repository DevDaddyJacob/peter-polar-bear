import { Application } from "@/app";
import { errorModuleLogger } from "@/modules/loggingModule.ts";
import { toErrorString } from "@/utils/functions.ts";

process.on("uncaughtException", e =>
	errorModuleLogger.fatal("Encountered an uncaughtException event!\n%s", toErrorString(e))
);
process.on("unhandledRejection", r =>
	errorModuleLogger.fatal(
		"Encountered an unhandledRejection event!\n%s",
		toErrorString(r as Error)
	)
);

export const app = new Application();

await app.start();
