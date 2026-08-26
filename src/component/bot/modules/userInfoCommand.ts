import { ApplicationCommandOptionType } from "discord.js";
import { SingleSlashCommand } from "@/lib/bot/commands/singleSlashCommand.ts";

export const UserInfoCommand = new SingleSlashCommand(
	"user-info",
	{
		description: "Retrieves information of the specified user",
		dmPermission: false,
		options: [
			{
				type: ApplicationCommandOptionType.User,
				name: "user",
				description: "The user to lookup",
				required: true
			}
		]
	},
	async interaction => {}
);
