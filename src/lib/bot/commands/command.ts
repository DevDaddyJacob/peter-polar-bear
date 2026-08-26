import type {
	ApplicationCommandType,
	PermissionsString,
	RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";

import { PermissionsBitField } from "discord.js";

export abstract class Command {
	public abstract readonly type:
		| ApplicationCommandType.ChatInput
		| ApplicationCommandType.User
		| ApplicationCommandType.Message;
	public readonly name: string;
	public readonly dmPermission: boolean;
	public readonly defaultMemberPermissions: bigint;

	protected constructor(name: string, options: Partial<Command.Options>) {
		this.name = name;
		this.dmPermission = true === options.dmPermission;

		if ("bigint" === typeof options.defaultMemberPermissions) {
			this.defaultMemberPermissions = options.defaultMemberPermissions;
		} else if ("number" === typeof options.defaultMemberPermissions) {
			this.defaultMemberPermissions = BigInt(options.defaultMemberPermissions);
		} else if (Array.isArray(options.defaultMemberPermissions)) {
			this.defaultMemberPermissions = options.defaultMemberPermissions
				.map(perm => PermissionsBitField.Flags[perm])
				.reduce((perm, count) => perm + count, 0n);
		} else {
			this.defaultMemberPermissions = 0n;
		}
	}

	public abstract toJSON(): RESTPostAPIApplicationCommandsJSONBody;
}

export namespace Command {
	export interface Options {
		dmPermission: boolean;
		defaultMemberPermissions: number | bigint | PermissionsString[];
	}
}
