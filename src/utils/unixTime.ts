export class UnixTime {
	public static readonly FORMAT_REGEX = /(<t:\d+:[tTdDfFR]>)/;
	private date: Date;

	constructor(value?: string | number | Date) {
		if (typeof value === "string") {
			if (UnixTime.FORMAT_REGEX.test(value)) {
				const numVal = UnixTime.extractFromFormattedStr(value);
				this.date = new Date(UnixTime.unixToDate(numVal));
			} else {
				this.date = new Date(Date.parse(value));
			}
		} else if (typeof value === "number") {
			this.date = new Date(value);
		} else {
			this.date = new Date();
		}
	}

	public get timestamp(): number {
		return UnixTime.dateToUnix(this.date.getTime());
	}

	public set timestamp(value: number) {
		this.date = new Date(UnixTime.unixToDate(value));
	}

	private static dateToUnix(value: number): number {
		return Math.floor(value / 1000);
	}

	private static unixToDate(value: number): number {
		return value * 1000;
	}

	private static extractFromFormattedStr(formattedStr: string): number {
		return parseInt(formattedStr.slice(3, formattedStr.length - 3));
	}

	public static from(value?: string | number | Date): UnixTime {
		return new UnixTime(value);
	}

	public static fromTimestamp(timestamp: number): UnixTime {
		const obj = new UnixTime();
		obj.timestamp = timestamp;
		return obj;
	}

	public static toDate(value: UnixTime): Date {
		return new Date(UnixTime.unixToDate(value.timestamp));
	}

	public static now(): number {
		return UnixTime.dateToUnix(Date.now());
	}

	public static parse(value: string | Date): number {
		if (typeof value === "string" && UnixTime.FORMAT_REGEX.test(value)) {
			const numVal = UnixTime.extractFromFormattedStr(value);
			return UnixTime.unixToDate(numVal);
		}

		if ("string" === typeof value) {
			return UnixTime.dateToUnix(Date.parse(value));
		}

		return value.getTime();
	}

	public static UTC(
		year: number,
		monthIndex: number,
		date?: number,
		hours?: number,
		minutes?: number,
		seconds?: number,
		ms?: number
	): number {
		return UnixTime.dateToUnix(
			Date.UTC(year, monthIndex, date, hours, minutes, seconds, ms)
		);
	}

	public static shortTime(value?: string | number | Date): string {
		return UnixTime.from(value).shortTime();
	}

	public static longTime(value?: string | number | Date): string {
		return UnixTime.from(value).longTime();
	}

	public static shortDate(value?: string | number | Date): string {
		return UnixTime.from(value).shortDate();
	}

	public static longDate(value?: string | number | Date): string {
		return UnixTime.from(value).longDate();
	}

	public static shortDateTime(value?: string | number | Date): string {
		return UnixTime.from(value).shortDateTime();
	}

	public static longDateTime(value?: string | number | Date): string {
		return UnixTime.from(value).longDateTime();
	}

	public static relativeTime(value?: string | number | Date): string {
		return UnixTime.from(value).relativeTime();
	}

	public toString(): string {
		return this.shortDateTime();
	}

	public toDate(): Date {
		return UnixTime.toDate(this);
	}

	public shortTime() {
		return `<t:${this.timestamp}:t>`;
	}

	public longTime() {
		return `<t:${this.timestamp}:T>`;
	}

	public shortDate() {
		return `<t:${this.timestamp}:d>`;
	}

	public longDate() {
		return `<t:${this.timestamp}:D>`;
	}

	public shortDateTime() {
		return `<t:${this.timestamp}:f>`;
	}

	public longDateTime() {
		return `<t:${this.timestamp}:F>`;
	}

	public relativeTime() {
		return `<t:${this.timestamp}:R>`;
	}
}
