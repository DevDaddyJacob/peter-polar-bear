import type { ReverseMap } from "@/utils/types";

/**
 * Named with https://colornamer.robertcooper.me/
 */
const GroupedGenerics = {
	WHITE: 0xffffff,
	BLACK: 0x000000,

	GRAYS: {
		TROLLEY_GREY: 0x818181
	},

	GREEN: 0x00ff00,
	GREENS: {
		POISONOUS_PESTICIDE: 0x30c23f,
		VERDANT_OASIS: 0x5ecc71,
		ALARMING_SLIME: 0x32e02f,
		UFO_GREEN: 0x2ecc71,
		ALOHA: 0x1abc9c
	},

	YELLOW: 0xffff00,
	YELLOWS: {
		BASKET_OF_GOLD: 0xf5cc3b,
		FLOWEY_YELLOW: 0xfdf851,
		CHEESY_CHEETAH: 0xf0b132,
		EGG_TOAST: 0xf1c40f,
		HIGHLIGHTER_YELLOW: 0xf4e842
	},

	ORANGE: 0xffa500,
	ORANGES: {
		APRICOT_CHICKEN: 0xd98129,
		ORANGE_GLUTTONY: 0xe67e22
	},

	RED: 0xff0000,
	REDS: {
		BLOOD_BURST: 0xff4d4f,
		MANDARIN_RED: 0xe74d3c,
		MANDARIN_RED_2: 0xe74c3c,
		PERMANENT_GERANIUM_LAKE: 0xe02f2f,
		RED_BIRCH: 0x992d22,
		MELLOW_MELON: 0xe91e63
	},

	BLUE: 0x0000ff,
	BLUES: {
		SAILFISH: 0x3498bd,
		BLUE_DAMSELFLY: 0x2da1e2,
		LOST_IN_SPACE: 0x073763,
		DAYFLOWER: 0x3798db,
		DAYFLOWER_2: 0x3498db,
		STARRY_NIGHT: 0x226694,
		RHAPSODY_IN_BLUE: 0x052343,
		TANZINE: 0x7289da,
		LAPIS_LAZULI_BLUE: 0x206694
	},

	PURPLES: {
		LIBERAL_LILAC: 0x9b59b6
	}
} as const;

const UngroupedGenerics = {
	WHITE: GroupedGenerics.WHITE,
	BLACK: GroupedGenerics.BLACK,
	GREEN: GroupedGenerics.GREEN,
	YELLOW: GroupedGenerics.YELLOW,
	ORANGE: GroupedGenerics.ORANGE,
	RED: GroupedGenerics.RED,
	BLUE: GroupedGenerics.BLUE,
	...GroupedGenerics.GRAYS,
	...GroupedGenerics.GREENS,
	...GroupedGenerics.YELLOWS,
	...GroupedGenerics.ORANGES,
	...GroupedGenerics.REDS,
	...GroupedGenerics.BLUES,
	...GroupedGenerics.PURPLES
} as const;

export type GenericNamesType = keyof typeof GenericNames;
export const GenericNames: ReverseMap<typeof UngroupedGenerics> = Object.entries(
	UngroupedGenerics
).reduce((rMap, [k, v]) => {
	rMap[v] = k;
	return rMap;
	// biome-ignore lint/suspicious/noExplicitAny: -
}, {} as any);

export const Colours = {
	GENERIC: GroupedGenerics,

	SOFT: {
		GREEN: GroupedGenerics.GREENS.POISONOUS_PESTICIDE,
		YELLOW: GroupedGenerics.YELLOWS.BASKET_OF_GOLD,
		ORANGE: GroupedGenerics.ORANGES.APRICOT_CHICKEN,
		RED: GroupedGenerics.REDS.BLOOD_BURST,
		BLUE: GroupedGenerics.BLUES.BLUE_DAMSELFLY
	},

	VOTING: {
		ACTIVE: GroupedGenerics.GREENS.ALARMING_SLIME,
		CLOSED: GroupedGenerics.REDS.BLOOD_BURST,
		APPROVED: GroupedGenerics.YELLOWS.EGG_TOAST,
		DENIED: GroupedGenerics.REDS.RED_BIRCH
	},

	BOT: {
		// BRANDING: GroupedGenerics.PURPLES.LIBERAL_LILAC,
		BRANDING: GroupedGenerics.ORANGES.ORANGE_GLUTTONY,
		ERROR: GroupedGenerics.REDS.BLOOD_BURST,
		WARNING: GroupedGenerics.YELLOWS.BASKET_OF_GOLD,

		BCSO_BLUE: GroupedGenerics.BLUES.DAYFLOWER,
		WSU_RED: GroupedGenerics.REDS.MANDARIN_RED,
		WLR_GREEN: GroupedGenerics.GREENS.VERDANT_OASIS,
		CID_BLUE: GroupedGenerics.BLUES.STARRY_NIGHT,
		TED_YELLOW: GroupedGenerics.YELLOWS.FLOWEY_YELLOW,
		K9_BLUE: GroupedGenerics.BLUES.RHAPSODY_IN_BLUE
	}
} as const;
