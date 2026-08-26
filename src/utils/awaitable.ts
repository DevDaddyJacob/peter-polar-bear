export type Awaitable<T = void> = Promise<T>;

export type MaybeAwaitable<T = void> = T | Awaitable<T>;

export type AwaitableResolveFunc<T = unknown> = (value: T) => void;

// biome-ignore lint/suspicious/noExplicitAny: This is the signature of a project reject
export type AwaitableRejectFunc = (reason?: any) => void;

export function awaitable<T = void>(
	executor:
		| ((resolve: AwaitableResolveFunc<T>) => void)
		| ((resolve: AwaitableResolveFunc<T>, reject: AwaitableRejectFunc) => void)
): Awaitable<T> {
	return new Promise(executor);
}
