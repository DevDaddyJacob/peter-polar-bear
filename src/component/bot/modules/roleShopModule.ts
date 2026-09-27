import type { ButtonInteraction } from "discord.js";
import type { RolesType } from "@/bot/constants/roles.ts";
import type { Awaitable } from "@/utils/awaitable.ts";

import { ButtonStyle, ComponentType } from "discord.js";
import { Channels } from "@/bot/constants/channels.ts";
import { Roles } from "@/bot/constants/roles.ts";
import { StaticMessage } from "@/bot/lib/staticMessage.ts";
import { resolveGuild, resolveGuildExecutor } from "@/bot/utils.ts";
import { errorReport } from "@/error/report.ts";
import { FuzzyButton } from "@/lib/bot/buttons/fuzzyButton.ts";
import { DiscordFormatting } from "@/utils/discordFormatting.ts";

type RoleShopConfigEntry = {
	role: RolesType;
	description: string;
	emoji: string;
};

const ROLE_SHOP_CONFIG: Record<RolesType, RoleShopConfigEntry> = {
	[Roles.DEVELOPMENT_UPDATES]: {
		role: Roles.DEVELOPMENT_UPDATES,
		description: "Gives you access to the development channels",
		emoji: "🔔"
	},
	[Roles.CONTENT_UPDATES]: {
		role: Roles.CONTENT_UPDATES,
		description: "Gives you access to the content channels",
		emoji: "🔔"
	},
	[Roles.EXECUTIONERS_AUDIENCE]: {
		role: Roles.EXECUTIONERS_AUDIENCE,
		description: "Gives you access to the public shaming channel",
		emoji: "🎟️"
	}
};

export const RoleShopButton = new FuzzyButton(
	"role_shop_toggle_role_",
	"startsWith",
	async (interaction: ButtonInteraction) => {
		const guild = await resolveGuild(interaction);

		const roleId = interaction.customId.slice(22);

		const role = await guild.roles.fetch(roleId);
		if (null === role) {
			throw new Error(`No role found with id "${roleId}"`);
		}

		const executor = await resolveGuildExecutor(interaction, guild);

		if (executor.roles.cache.has(roleId)) {
			await executor.roles.remove(roleId, "User initiated role toggle");
		} else {
			await executor.roles.add(roleId, "User initiated role toggle");
		}

		await interaction.reply({
			content: "Role toggled!",
			flags: "Ephemeral"
		});
	}
);

const roleShopStaticMessage = new StaticMessage("role_shop", Channels.ROLE_SHOP, {
	allowedMentions: {
		parse: [],
		roles: [],
		users: []
	},
	flags: "IsComponentsV2",
	components: [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: "# 🏪 Role Shop"
				},
				...Object.values(ROLE_SHOP_CONFIG).map(c => ({
					type: ComponentType.Section,
					components: [
						{
							type: ComponentType.TextDisplay,
							content: `${DiscordFormatting.Role(c.role)} ${c.description}`
						}
					],
					accessory: {
						type: ComponentType.Button,
						style: ButtonStyle.Primary,
						custom_id: `${RoleShopButton.id}${c.role}`,
						emoji: {
							name: c.emoji
						}
					}
				}))
			]
		}
	]
});

export async function periodicRoleShopRefresh(): Awaitable {
	// Ensure the info message exists
	try {
		await roleShopStaticMessage.update();
	} catch (err) {
		await errorReport(err as Error);
	}
}
