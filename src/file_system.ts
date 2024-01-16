export async function readFile(path: string): Promise<[string, string]> {
	const bytes = await Deno.readFile(path);
	const decoder = new TextDecoder('utf-8');
	return [path, decoder.decode(bytes)];
}

export async function writeFile(path: string, text: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	await Deno.writeFile(path, data);
}

/**
 * Read files from a directory
 * @param dirPath directory where the files are
 * @returns a promise of with an array of path/text tuples
 */
export function readDirectory(dirPath: string): Promise<[string, string][]> {
	const requests: Promise<[string, string]>[] = [];
	for (const doc of Deno.readDirSync(dirPath)) {
		if (doc.isFile) {
			requests.push(readFile(`${dirPath}/${doc.name}`));
		}
	}
	return Promise.all(requests);
}

