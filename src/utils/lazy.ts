export class Lazy<T> {
	// noinspection JSPrimitiveTypeWrapperUsage
	private static readonly NON_INITIALIZED = new Object();

	public static of<T>(initializer: () => T) {
		return new Lazy(initializer);
	}

	private readonly initializer: () => T;
	private data: T = <T>Lazy.NON_INITIALIZED;

	private constructor(initializer: () => T) {
		this.initializer = initializer;
	}

	public computed(): boolean {
		return Lazy.NON_INITIALIZED === this.data;
	}

	public get(): T {
		if (Lazy.NON_INITIALIZED !== this.data) {
			return this.data;
		}

		const result = this.initializer();
		this.data = result;

		return this.data;
	}

	public reset(): void {
		this.data = <T>Lazy.NON_INITIALIZED;
	}
}

export class LazyAsync<T> {
	// noinspection JSPrimitiveTypeWrapperUsage
	private static readonly NON_INITIALIZED = new Object();

	public static of<T>(initializer: () => Promise<T>) {
		return new LazyAsync(initializer);
	}

	private readonly initializer: () => Promise<T>;
	private data: T = <T>LazyAsync.NON_INITIALIZED;

	private constructor(initializer: () => Promise<T>) {
		this.initializer = initializer;
	}

	public computed(): boolean {
		return LazyAsync.NON_INITIALIZED === this.data;
	}

	public async get(): Promise<T> {
		if (LazyAsync.NON_INITIALIZED !== this.data) {
			return this.data;
		}

		const result = await this.initializer();
		this.data = result;

		return this.data;
	}

	public reset(): void {
		this.data = <T>LazyAsync.NON_INITIALIZED;
	}
}
