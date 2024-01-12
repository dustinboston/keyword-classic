import { compromise, flags } from './deps.ts';
import { DocumentMetadata, FileAttrs, ParsedFrontMatter } from './types.d.ts';
import { parseText, readFile } from './file_system.ts';

export function partsOfSpeech(data: ParsedFrontMatter<FileAttrs>) {
	const metadata = preliminaries(data.body);
	const document = extractDocument(metadata);
	return document;
}

export function preliminaries(text: string): DocumentMetadata[] {
	const doc = compromise(text);
  return doc.json();
	// doc.compute('root');
	// doc.normalize('heavy');
	// return doc.json();
}

/**
 * Extracts terms from document metadata.
 * Filters out terms that have tags in
 *
 * @param metadata The metadata to convert into filtered ngrams.
 * @return lists of ngrams.
 */
export function extractDocument(
	metadata: DocumentMetadata[],
): string[] {
	return metadata.flatMap((m) =>
		m.terms.flatMap((term) => {
      return `${term.text} (${Array.from(term.tags ?? []).join(', ').toLowerCase()})`
    })
	);
}

function showHelp(errorMessage = '') {
	const help = `Usage: keyword_classic [OPTION]... FILE

Extract keywords from a FILE using classic NLP algorithms.
FILE can be any text-based file. YAML front-matter is supported.

-c, --config YAML	
-t, --topk NUM		Limit the results to the top K percent of results.
Defaults to 10 (%). Use 100 to show all results.
-h, --help			Show this message.
  `;

	if (errorMessage) console.error(errorMessage);
	console.log(help);
}

export async function parseArguments() {
	const cli = flags.parse(Deno.args, {
		boolean: ['help'],
		string: ['topk', 'config'],
		alias: { help: 'h', topk: 't', config: 'c' },
		default: { config: '', topk: 10 },
	});

	const [file] = cli._;
	if (!file || typeof file !== 'string') {
		showHelp('A file is required.');
		Deno.exit(1);
	}

	if (cli.help) {
		showHelp();
		Deno.exit(0);
	}

	const [, text] = await readFile(file);
	const data = parseText<FileAttrs>(text);

	return { data, cli };
}

export async function main() {
	const { data } = await parseArguments();
	const results = partsOfSpeech(data);
  const out = [];
	for (const result of results) {
    const [word, pos] = result.split('(');
    if (pos.includes('noun')) {
      out.push(`<mark>${word.trim()}</mark>`);
    } else if (pos.includes('verb') && !pos.includes('adverb')) {
      out.push(`<mark class="bl">${word.trim()}</mark>`);
    } else {
      out.push(word.trim());
    }
	}
  console.log(out.join(' '));
}

if (import.meta.main) {
	main();
}
