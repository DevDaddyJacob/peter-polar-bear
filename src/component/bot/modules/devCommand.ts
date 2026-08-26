import { unlink, writeFile } from "node:fs/promises";
import { format } from "node:util";
import { ApplicationCommandOptionType } from "discord.js";
import { SlashCommandGroup } from "@/lib/bot/commands/slashCommandGroup.ts";
import { SlashSubCommand } from "@/lib/bot/commands/slashSubCommand.ts";

const CommandError = new SlashSubCommand(
	"error",
	{
		description: "Throws an error",
		dmPermission: false
	},
	function (this, _) {
		throw new Error("This is an error");
	}
);

const CommandPing = new SlashSubCommand(
	"ping",
	{
		description:
			"Checks to see if the Bot is online, and also sends the server response time.",
		dmPermission: false
	},
	async function (this, interaction) {
		await interaction.reply({
			flags: "Ephemeral",
			content:
				`**:ping_pong: ${this.user?.displayName} Latency Data**\n` +
				`- API Latency: \`${this.ws.ping} ms\``
		});
	}
);

const CommandEval = new SlashSubCommand(
	"eval",
	{
		description: "Evaluates a sample of code",
		dmPermission: true,
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "code",
				description: "The code to evaluate",
				required: true
			}
		]
	},
	async function (this, interaction) {
		if ("194201083738980353" !== interaction.user.id) {
			await interaction.reply({
				content: "You cannot use this command.",
				flags: "Ephemeral"
			});

			return;
		}

		await interaction.deferReply({ ephemeral: true });

		// Try to run the code
		// biome-ignore lint/suspicious/noExplicitAny: required
		let output: any;
		let error = false;
		try {
			output = await eval(interaction.options.getString("code", true));
		} catch (err) {
			output = err;
			error = true;
		}

		const formattedOutput = format(output);

		const formattedContent = `\`\`\`${formattedOutput}\n\`\`\``;

		// biome-ignore lint/style/noTernary: -
		const maxLength = error ? 1000 : 2000;

		if (formattedContent.length > maxLength) {
			const length = maxLength - (formattedContent.length - formattedOutput.length) - 3;
			const shortenedContent = `\`\`\`${formattedOutput.slice(0, length)}...\n\`\`\``;
			const path = `./${interaction.id}.txt`;

			await writeFile(path, formattedOutput);

			await interaction.editReply({
				content: shortenedContent,
				files: [path]
			});

			await unlink(path);
			return;
		}

		await interaction.editReply(formattedContent);
	}
);

export const CommandDev = new SlashCommandGroup(
	"dev",
	{
		description: "Development commands"
	},
	CommandError,
	CommandEval,
	CommandPing
);
