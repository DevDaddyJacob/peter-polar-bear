export function getDeepStackTrace<T extends Error>(error: T): string {
	const stacks: string[] = [];

	let firstStackDone = false;
	let workingError: Error | undefined = error;
	do {
		const stack = workingError.stack;
		if (stack !== undefined) {
			let stackPrefix = "";
			if (firstStackDone) {
				stackPrefix = "caused by ";
			}

			stacks.push(stackPrefix + stack);
			firstStackDone = true;
		}

		workingError = workingError.cause as Error | undefined;
	} while (workingError !== undefined);

	return stacks.join("\n");
}

export type StackLineDetails = {
	stackLineNumber: number;
	methodName: string;
	rowNumber: number;
	columnNumber: number;
	fullFilePath: string;
	fileName: string;
};

export function readErrorStackDetails<T extends Error>(
	error: T,
	options?: Partial<{ useRelativePath: boolean }>
): StackLineDetails[] {
	if (error.stack === undefined) {
		return [];
	}

	const stackReg =
		/^ {4}at (?<method>.+) \((?<filePath>.+[\\/](?<fileName>[^: ]+)):(?<row>[0-9]+):(?<col>[0-9]+)\)/;
	const opts = {
		useRelativePath: false,
		// biome-ignore lint/style/noTernary: -
		...(options === undefined ? {} : options)
	};

	const stackLines = error.stack
		.split(/\r?\n/)
		.map(line => {
			line = line.replaceAll("\\", "/");
			if (opts.useRelativePath) {
				line = line
					.replaceAll(`file:///${process.cwd().replaceAll("\\", "/")}`, ".")
					.replaceAll(`file:///${process.cwd()}`, ".")
					.replaceAll(process.cwd().replaceAll("\\", "/"), ".")
					.replaceAll(process.cwd(), ".");
			}
			return line;
		})
		.map(line => line.match(stackReg)) as (RegExpMatchArray | null)[];

	const lines = [];
	let lineNum = 1;

	for (const line of stackLines) {
		if (line === null || line.groups === undefined) {
			lineNum++;
			continue;
		}

		lines.push({
			stackLineNumber: lineNum,
			methodName: line.groups.method,
			rowNumber: parseInt(line.groups.row),
			columnNumber: parseInt(line.groups.col),
			fullFilePath: line.groups.filePath,
			fileName: line.groups.fileName
		});

		lineNum++;
	}

	return lines;
}
