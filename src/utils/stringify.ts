import stringify from "safe-stable-stringify";

export const jsonStringify = stringify.configure({
	strict: false,
	maximumBreadth: 250,
	maximumDepth: 100
});

export function jsonReplacer(
	key: string,
	// biome-ignore lint/suspicious/noExplicitAny: -
	value: any
): string | number | boolean | null | object {
	if (typeof value === "bigint") {
		return value.toString();
	}

	if (Array.isArray(value) && 250 < value.length) {
		return "[Array]";
	}

	return value;
}
