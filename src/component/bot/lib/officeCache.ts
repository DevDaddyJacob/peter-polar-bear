import type { Expression, FuseSearchOptions } from "fuse.js";
import type { DbOffice } from "@/db/types.ts";
import type { Awaitable } from "@/utils/awaitable.ts";

import anyAscii from "any-ascii";
import Fuse from "fuse.js";
import { db } from "@/db/connect.ts";
import { assert } from "@/utils/functions.ts";

export type IndexedDbOffice = DbOffice & {
	normalizedOfficeName: string;
};

export class OfficeCache {
	private static readonly CACHE_TTL_MS = 5 * 60 * 1000;

	public static normalizeToAscii(value: string): string {
		return anyAscii(value)
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, "")
			.replace(/\s+/g, " ")
			.trim();
	}

	private cache: IndexedDbOffice[] = [];
	private fuse: Fuse<IndexedDbOffice> | null = null;
	private lastFetch = 0;

	public get data() {
		return [...this.cache];
	}

	private get needsRefresh() {
		return (
			0 === this.cache.length || OfficeCache.CACHE_TTL_MS < Date.now() - this.lastFetch
		);
	}

	public async get(officeId: string): Awaitable<IndexedDbOffice | null> {
		if (this.needsRefresh) {
			await this.refresh();
		}

		return this.cache.find(o => officeId === o.officeId) ?? null;
	}

	public async searchByName(
		query: string | Expression,
		options?: FuseSearchOptions
	): Awaitable<ReturnType<Fuse<IndexedDbOffice>["search"]>> {
		if (this.needsRefresh) {
			await this.refresh();
		}

		assert(null !== this.fuse);

		return this.fuse.search(query, options);
	}

	public async refresh() {
		const offices = await db().query.offices.findMany();

		this.cache = offices.map(o => ({
			...o,
			normalizedOfficeName: OfficeCache.normalizeToAscii(o.officeName)
		}));

		this.fuse = new Fuse(this.cache, {
			keys: ["normalizedOfficeName"],
			threshold: 0.35, // lower = stricter, higher = fuzzier
			ignoreLocation: true,
			minMatchCharLength: 2
		});

		this.lastFetch = Date.now();
	}
}
