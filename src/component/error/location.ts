import type { StackLineDetails } from "@/error/utils.ts";

import { ERROR_ENV_CONFIG } from "@/error/config.ts";

// biome-ignore lint/suspicious/useAwait: temporary until we implement GitHub handling
export async function getErrorLocation(
	stackLine: StackLineDetails
): Promise<string | null> {
	switch (ERROR_ENV_CONFIG.locationResolution) {
		default: {
			return null;
		}
	}
}

/*
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: One day I will fix this
async function getErrorLocationGitlab(
	stackLine: StackLineDetails
): Promise<string | null> {
	// Get the file path
	const rawMethodName = stackLine.methodName.match(/(?:async )?(?:.+\.)?(.+)/)?.[1];
	if (rawMethodName === undefined) {
		return null;
	}

	const fullPath = stackLine.fullFilePath;
	if (!/(?<!node_modules.*)src[/\\]/.test(fullPath)) {
		return null;
	}
	const reducedPath = fullPath.slice(fullPath.indexOf("src"));

	// Fetch against the gitlab API
	const file = await getGitLabFileContent(reducedPath);
	if (file === null) {
		return null;
	}

	// Pretty up the content to only be the relative section
	const lines = file.split(/\r?\n/);
	const problemLineIndex = stackLine.rowNumber - 1;
	let funcLineIndex: number = problemLineIndex;
	for (let i = problemLineIndex; i > 0; i--) {
		if (lines[i].includes(rawMethodName)) {
			funcLineIndex = i;
			break;
		}
	}

	const outputLines: [number, string][] = [];
	let maxLineNum = problemLineIndex;
	for (let i = funcLineIndex; i < problemLineIndex + 5; i++) {
		if (i > lines.length - 1) {
			break;
		}
		outputLines.push([i + 1, lines[i]]);

		if (i + 1 > maxLineNum) {
			maxLineNum = i + 1;
		}
	}

	const formattedLines: string[] = [];
	const maxLineChars = maxLineNum.toString().length;
	const maxSidebarChars = maxLineChars + 2;
	let problemFormattedIndex: number | undefined;
	for (const outputLine of outputLines) {
		const lineNum = outputLine[0];
		const line = outputLine[1];
		const isProblemLine = lineNum === problemLineIndex + 1;

		if (isProblemLine) {
			problemFormattedIndex = formattedLines.length;
		}

		const prefixer =
			// biome-ignore lint/style/noTernary: -
			(isProblemLine ? "> " : "") +
			lineNum
				.toString()
				// biome-ignore lint/style/noTernary: -
				.padStart(maxSidebarChars - (isProblemLine ? maxLineChars : 0), " ") +
			" | ";

		formattedLines.push(prefixer + line);

		if (isProblemLine) {
			formattedLines.push(
				"".padStart(maxSidebarChars, " ") +
					" | " +
					"".padStart(stackLine.columnNumber - 1, " ") +
					"^"
			);
		}
	}

	if (problemFormattedIndex !== undefined && problemFormattedIndex > 6) {
		formattedLines.splice(
			1,
			problemFormattedIndex - 2,
			`${"\\/".padStart(maxSidebarChars, " ")} |`
		);
	}

	return `${reducedPath}\n${formattedLines.join("\n")}`;
}
*/
