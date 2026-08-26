import {
	appendFileSync,
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readSync,
	renameSync,
	statSync,
	unlinkSync,
	writeSync
} from "node:fs";
import { join } from "node:path";
import { format } from "node:util";

// Every formatted line starts with the full timestamp, e.g.
// "2026-07-22T18:00:00.000-0400 ...", so a log file describes its own dates.
const LINE_DAY = /^(\d{4}-\d{2}-\d{2})T/;
const CHUNK_SIZE = 64 * 1024;

// Local-date key, e.g. "2026-07-21". Local (not UTC) to match the log timestamps.
function dayKey(date: Date): string {
	return format(
		"%s-%s-%s",
		date.getFullYear().toString(),
		(date.getMonth() + 1).toString().padStart(2, "0"),
		date.getDate().toString().padStart(2, "0")
	);
}

// Epoch ms of the next local midnight after `date`.
function nextMidnight(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
}

/**
 * Walk a file line by line, handing each line to `onLine` along with the day it
 * belongs to. Lines without a leading timestamp (wrapped messages, stack traces)
 * inherit the day of the line above them. Read in chunks so a large file is
 * never held in memory.
 */
function eachLineWithDay(
	path: string,
	fallbackDay: string,
	onLine: (day: string, line: string) => void
): void {
	const fd = openSync(path, "r");
	const buffer = Buffer.allocUnsafe(CHUNK_SIZE);
	let pending = "";
	let day = fallbackDay;

	function handle(line: string): void {
		const match = LINE_DAY.exec(line);
		if (null !== match) {
			day = match[1] as string;
		}

		onLine(day, `${line}\n`);
	}

	try {
		let read = 0;
		// biome-ignore lint/suspicious/noAssignInExpressions: Non-complex use
		while (0 < (read = readSync(fd, buffer, 0, buffer.length, null))) {
			pending += buffer.subarray(0, read).toString("utf8");

			let newline = pending.indexOf("\n");
			while (-1 !== newline) {
				handle(pending.slice(0, newline));
				pending = pending.slice(newline + 1);
				newline = pending.indexOf("\n");
			}
		}
	} finally {
		closeSync(fd);
	}

	// A trailing line with no newline (process killed mid-write).
	if (0 < pending.length) {
		handle(pending);
	}
}

export interface RotatingSinkOptions {
	/** Directory holding the active and archived files, e.g. "logs". */
	dir: string;
	/** Basename of the active file, e.g. "current". */
	base: string;
	/** Extension including the dot, e.g. ".log" or ".trace". */
	ext: string;
}

/**
 * A sink that writes to `<dir>/<base><ext>` and, once the local date changes,
 * moves those lines to `<dir>/YYYY-MM-DD<ext>`. The archive is named for the day
 * of the *content*, read from each line's own timestamp, so a stale active file
 * left behind by a restart is always filed under the day it actually covers —
 * even if the file's mtime says otherwise. Existing archives are appended to,
 * never overwritten.
 */
export function rotatingFileSink(opts: RotatingSinkOptions): {
	write(line: string): void;
} {
	mkdirSync(opts.dir, { recursive: true });
	const activePath = join(opts.dir, `${opts.base}${opts.ext}`);
	const stagePath = join(opts.dir, `${opts.base}${opts.ext}.staged`);

	let fd = -1;
	let contentDay = ""; // the day the lines in the active file belong to
	let rollAtMs = 0; // epoch ms at which the active file must rotate

	function archivePath(day: string): string {
		return join(opts.dir, `${day}${opts.ext}`);
	}

	function open(day: string, now: Date): void {
		fd = openSync(activePath, "a");
		contentDay = day;
		rollAtMs = nextMidnight(now);
	}

	/**
	 * Drain the active file: every line goes to the archive for its own day,
	 * except lines belonging to `keepDay`, which are staged and put back into a
	 * fresh active file. Handles a file that already mixes several days.
	 * The caller must have closed `fd` first — Windows refuses to rename or
	 * delete a file that still has an open handle (EPERM/EBUSY).
	 */
	function drainActive(keepDay: string, fallbackDay: string): void {
		if (!existsSync(activePath) || 0 === statSync(activePath).size) {
			return;
		}

		if (existsSync(stagePath)) {
			unlinkSync(stagePath);
		}

		// Lines are chronological, so each day forms one contiguous run: buffer a
		// run and flush it in a single append rather than one write per line.
		let batchTarget = "";
		let batch = "";

		function flush(): void {
			if (0 === batch.length) {
				return;
			}

			appendFileSync(batchTarget, batch);
			batch = "";
		}

		eachLineWithDay(activePath, fallbackDay, (day, line) => {
			// biome-ignore lint/style/noTernary: -
			const target = day === keepDay ? stagePath : archivePath(day);

			if (target !== batchTarget) {
				flush();
				batchTarget = target;
			}

			batch += line;
		});

		flush();
		unlinkSync(activePath);

		if (existsSync(stagePath)) {
			renameSync(stagePath, activePath);
		}
	}

	// Boot: an active file may hold an earlier day's lines (app was down over
	// midnight), or even several days' worth if a previous run failed to rotate.
	// mtime is only a fallback for lines that carry no timestamp of their own.
	const bootTime = new Date();
	const bootDay = dayKey(bootTime);

	if (existsSync(activePath)) {
		drainActive(bootDay, dayKey(statSync(activePath).mtime));
	}

	open(bootDay, bootTime);

	return {
		write(line: string): void {
			const nowMs = Date.now();

			if (nowMs >= rollAtMs) {
				const now = new Date(nowMs);

				try {
					closeSync(fd);
					drainActive(dayKey(now), contentDay);
				} catch (error) {
					// A rotation failure must never take the app down; keep logging.
					console.error("log rotation failed:", error);
				}

				open(dayKey(now), now);
			}

			writeSync(fd, line);
		}
	};
}
