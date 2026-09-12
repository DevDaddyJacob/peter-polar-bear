import type { NonEmptyArray } from "@/utils/types";

import { z } from "zod";
import { assert, setNestedValue } from "@/utils/functions";

export type ValidatorScheme = {
	[key: string]: ValidatorScheme | z.ZodType;
};

export type ValidatedObject<T extends ValidatorScheme> = {
	[K in keyof T]: T[K] extends ValidatorScheme ? ValidatedObject<T[K]> : z.output<T[K]>;
};

export function validate<T extends ValidatorScheme>(scheme: T): ValidatedObject<T> {
	const get = (key: string): string | undefined => {
		if (Object.hasOwn(process.env, key)) {
			return process.env[key];
		}

		return undefined;
	};

	const validated = {};

	const objStack: [string[], ValidatorScheme][] = [[[], scheme]];

	while (0 < objStack.length) {
		const entry = objStack.pop();
		assert(undefined !== entry);

		const [objKey, objValue] = entry;

		for (const [key, value] of Object.entries(objValue)) {
			const keyPathArr: NonEmptyArray<string> = [...objKey].concat(
				key
			) as NonEmptyArray<string>;

			if (!(value instanceof z.ZodType)) {
				objStack.push([keyPathArr, value]);
				continue;
			}

			const envKey = keyPathArr.join("_");

			try {
				const parsedValue = value.parse(get(envKey));
				setNestedValue(validated, keyPathArr, parsedValue);
			} catch (err) {
				console.error(`Failed to parse environment variable with key "${envKey}"`);
				throw err;
			}
		}
	}

	return validated as ValidatedObject<T>;
}
