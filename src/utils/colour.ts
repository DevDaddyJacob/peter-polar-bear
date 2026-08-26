import type { KeyOf, MaybeArray } from "@/utils/types.ts";

const ANSI = {
	ESC_START: "\x1b[",
	ESC_END: "m",

	BOLD: "1;",
	RESET: "0;",

	BLACK_FG: "30",
	RED_FG: "31",
	GREEN_FG: "32",
	YELLOW_FG: "33",
	BLUE_FG: "34",
	MAGENTA_FG: "35",
	CYAN_FG: "36",
	WHITE_FG: "37",
	DEFAULT_FG: "39"
} as const;

export type ColourStyle = KeyOf<Omit<typeof ANSI, "ESC_START" | "ESC_END">>;

export function colour(style: MaybeArray<ColourStyle>, text: string) {
	const styleArr: ColourStyle[] = [];
	if (Array.isArray(style)) {
		styleArr.push(...style);
	} else {
		styleArr.push(style);
	}

	if (0 === styleArr.length) {
		return text;
	}

	return [
		...styleArr.map(s => ANSI.ESC_START + ANSI[s] + ANSI.ESC_END),
		text,
		ANSI.ESC_START + ANSI.RESET + ANSI.ESC_END
	].join("");
}
