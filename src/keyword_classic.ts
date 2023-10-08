/**
 * Keyword Classic
 * Extract keywords from a document using some classlic NLP methods:
 * - Textrank: Weighted Textrank over NGrams.
 * - NGrams: Basic frequency-based NGrams.
 * - TF-IDF: Each sentence is considered a document.
 * @file
 */

import compromise from 'https://esm.sh/compromise@14.10.0';
import stats from 'https://esm.sh/compromise-stats@0.1.0';
import type { StatsMethods } from 'https://esm.sh/compromise-stats@0.1.0';
import { parse } from 'https://deno.land/std@0.203.0/flags/mod.ts';

import { parseText, readFile } from './file_system.ts';
import textrank, { TextrankMethods } from './textrank_plugin.ts';
import {
	CommandLineFlags,
	DocumentAttributes,
	Features,
	ParsedDocument,
	PluginView,
	ScoredResult,
} from './types.d.ts';

compromise.plugin(stats);
compromise.plugin(textrank);

export function keywordClassic(job: ParsedDocument) {
	const doc = preliminaries(job.body);
	return extractFeatures(doc);
}

export function preliminaries(text: string): PluginView {
	const doc = compromise<StatsMethods & TextrankMethods>(text);

	doc.normalize('heavy');

	doc.remove('#NumericValue')
		.remove('#Money')
		.remove('#Fraction')
		.remove('#Percent')
		.remove('#PhoneNumber')
		.remove('#Date');

	// Stopwords
	doc.remove('#Determiner')
		.remove('#Preposition')
		.remove('#Conjunction')
		.remove('#Pronoun')
		.remove('#Copula')
		.remove('&');

	doc.remove('#Url')
		.remove('#Emoji')
		.remove('#Emoticon')
		.remove('#AtMention')
		.remove('#Email')
		.remove('#HashTag');

	return doc;
}

export function extractFeatures(doc: PluginView): Features {
	const tfidf: ScoredResult = doc.tfidf();
	const textrank: ScoredResult = Array.from(doc.textrankNgrams());
	const ngrams: ScoredResult = doc.ngrams({ min: 1, max: 4 })
		.map<[string, number]>((n) => [n.normal, n.count]);

	return { tfidf, textrank, ngrams };
}

async function main() {
	// algo values: all, textrank, tfidf, ngrams
	const flags: CommandLineFlags = parse(Deno.args, {
		string: ['a', 'l'],
		alias: { algo: 'a', limit: 'l' },
		default: { limit: 10, algo: 'textrank' },
	});

	const [file] = flags._ as string[];
	if (!file) throw new Error('A file is required.');

	const [_path, text] = await readFile(file);
	const json = parseText<DocumentAttributes>(text);

	const result = keywordClassic(json);
	const limit = (feature: ScoredResult): ScoredResult => {
		const percent = +flags.limit;
		const decimal = percent * .01;
		const count = Math.round(feature.length * decimal);
		return feature.slice(0, count);
	};

	const print: Record<string, [string, number][]> = {};

	switch (flags.algo as string) {
		case 'texrank':
			print['textrank'] = limit(result.textrank);
			break;
		case 'ngrams':
			print['ngrams'] = limit(result.ngrams);
			break;
		case 'tfidf':
			print['tfidf'] = limit(result.tfidf);
			break;
		case 'all':
			print['textrank'] = limit(result.textrank);
			print['ngrams'] = limit(result.ngrams);
			print['tfidf'] = limit(result.tfidf);
			break;
		default:
			print['textrank'] = limit(result.textrank);
			break;
	}

	console.log(JSON.stringify(print, null, '    '));
}

if (import.meta.main) {
	main();
}
