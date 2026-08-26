/**
 * Represents a conditional tuple return, where one element is always undefined.
 */
export type Failable<T, E extends Error = Error> =
	| ([value: undefined, error: E] | [error: E])
	| [value: T, error: undefined];

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type NonEmptyArray<T> = [T, ...T[]];

export type MaybeArray<T> = T | T[];

export type ValueOf<T> = T[keyof T];

export type KeyOf<T> = keyof T;

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// biome-ignore lint/suspicious/noExplicitAny: -
export type ReverseMap<T extends Record<keyof T, keyof any>> = {
	[K in keyof T as T[K]]: K;
};
