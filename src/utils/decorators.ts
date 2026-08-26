import type { Logger } from "pino";
import type { Awaitable } from "@/utils/awaitable.ts";

import { jsonReplacer, jsonStringify } from "@/utils/stringify.ts";

export function TraceInvocation(logger: Logger) {
	// biome-ignore lint/suspicious/noExplicitAny: Justified use-case
	// biome-ignore lint/complexity/noBannedTypes: Justified use-case
	return <This extends { constructor: Function }, Args extends any[], Return>(
		originalMethod: (this: This, ...args: Args) => Return,
		context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
	) =>
		function (this: This, ...args: Args): Return {
			// biome-ignore lint/style/noTernary: Lets it stay const
			const name = "string" === context.name ? context.name : context.name.toString();

			let argsStr = "";
			if (0 < args.length) {
				argsStr = ` ${jsonStringify(args, jsonReplacer)}`;
			}

			logger.trace(`${this.constructor.name}.${name}: Entered scope${argsStr}`);
			const value = originalMethod.apply(this, args);
			logger.trace(`${this.constructor.name}.${name}: Exited scope`);

			return value;
		};
}

export function TraceInvocationAsync(logger: Logger) {
	// biome-ignore lint/suspicious/noExplicitAny: Justified use-case
	// biome-ignore lint/complexity/noBannedTypes: Justified use-case
	return <This extends { constructor: Function }, Args extends any[], Return>(
		originalMethod: (this: This, ...args: Args) => Awaitable<Return>,
		context: ClassMethodDecoratorContext<
			This,
			(this: This, ...args: Args) => Awaitable<Return>
		>
	) =>
		async function (this: This, ...args: Args): Awaitable<Return> {
			// biome-ignore lint/style/noTernary: Lets it stay const
			const name = "string" === context.name ? context.name : context.name.toString();

			let argsStr = "";
			if (0 < args.length) {
				argsStr = ` ${jsonStringify(args, jsonReplacer)}`;
			}

			logger.trace(`${this.constructor.name}.${name}: Entered scope${argsStr}`);
			const value = await originalMethod.apply(this, args);
			logger.trace(`${this.constructor.name}.${name}: Exited scope`);

			return value;
		};
}
