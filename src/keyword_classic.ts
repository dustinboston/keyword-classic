/**
 * Keyword Classic
 * Extract keywords from a document using some classic NLP algorithms:
 *
 * - Textrank
 * - Cosine Similarity
 * - Edit Distance
 * - TF-IDF
 */

import { compromise, Document, flags } from './deps.ts';
import {
	Config,
	DocumentMetadata,
	FileAttrs,
	ParsedYaml,
	Scores,
} from './types.d.ts';
import { parseText, parseYaml, readFile } from './file_system.ts';
import { getNgrams } from './ngrams.ts';
import { NgramExtractionStrategy } from './ngram_extraction_strategy.ts';
import { Textrank } from './textrank.ts';
import { Vert } from './vert.ts';
import { IGNORE_LIST } from './constants.ts';
import { KewordExtractionStrategy } from './keword_extraction_strategy.ts';

export function keywordClassic(
	data: ParsedYaml<FileAttrs>,
	config: Config = {},
) {
	if (config?.extend) compromise.extend(config.extend);

	const metadata = preliminaries(data.body);
	const document = extractDocument(metadata, config);

  // Ngrams
	const ngrams = extractNgramTextrank(document, metadata);
	const tagNgrams = applyTagWeights(ngrams, config);
  const sortedNgrams = tagNgrams.toSorted((a, b) => b.score - a.score);
	const scoredNgrams = getScores(sortedNgrams);
 //  const topKNgrams = topkResults(scoredNgrams, 2)

  // console.log('ngrams')
  // for (const score of sortedNgrams) {
  //   // console.log(score.join(' '));
  //   console.log(score.val, score.score, score.weights);
  // }


  // Keywords
	const keywords = extractKeywordsTextrank(document, metadata);
	const tagKeywords = applyTagWeights(keywords, config);
  const sortedKeywords = tagKeywords.toSorted((a, b) => b.score - a.score);
  const scoredKeywords = getScores(sortedKeywords)
  // const topKKeywords = topkResults(scoredKeywords, 10);

  // console.log('\nkeywords\n'.padEnd(80, '-'))
  // for (const score of sortedKeywords) {
  //   console.log(score.val, score.score, score.weights);
  // }

  return { scoredNgrams, scoredKeywords };
}

export function preliminaries(text: string): DocumentMetadata[] {
	const doc = compromise(text);
	doc.compute('root');
	doc.normalize('heavy');
	return doc.json();
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
	config?: Config,
): Document {
	const ignoreConfig = config?.ignore?.tags ?? IGNORE_LIST;
	const ignoreList = new Set(ignoreConfig);

	const document: Document = metadata
		.map((m) =>
			m.terms.filter((term) => {
				if (term?.tags === undefined) return [];
				return !Array.from(term.tags).some((tag) =>
					ignoreList.has(tag)
				);
			})
		);

	return document;
}

export function extractNgramTextrank(
	document: Document,
	metadata: DocumentMetadata[],
): Vert[] {
	const ngrams = getNgrams(document, 2, 5);
	const textrank = new Textrank(new NgramExtractionStrategy());
	const rankedNgrams = textrank.extractData(ngrams);
	const completeTerms = recontextualizeTerms(rankedNgrams, metadata);
	return completeTerms;
}

export function extractKeywordsTextrank(
	document: Document,
	metadata: DocumentMetadata[],
): Vert[] {
  const words = document.flatMap((t) => t).map(u => [u]);
	const textrank = new Textrank(new KewordExtractionStrategy(1));
	const ranked = textrank.extractData(words);
	const completeTerms = recontextualizeTerms(ranked, metadata);
	return completeTerms;
}

/**
 * Rebuild the original sentence for each result and replace the `val` field
 * of each vertex with the result.
 * @param vert An array of vertices from the textrank algorithm.
 * @param metadata The original metadata before processing.
 * @returns an array of vertices
 */
export function recontextualizeTerms(
	vert: Vert[],
	metadata: DocumentMetadata[],
) {
	return vert.map((v) => {
		if (v.ngram.length === 0) throw new Error('Invalid empty ngram');
		if (v.ngram.length === 1) return { ...v, val: v.ngram[0].text };
		if (v.ngram.length > 1) {
			const [line, start] = v.ngram[0].index ?? [];
			const [, end] = v.ngram[v.ngram.length - 1].index ?? [];

			if (line !== void 0 && start !== void 0 && end !== void 0) {
				const sentence = metadata[line].terms;
				const terms = sentence.slice(start, end + 1);
				const val = terms.map((t) => t.text).join(' ');
				return { ...v, val };
			}
		}
		return v;
	});
}

/**
 * Applies tag-based weights to a collection of vertices. Each vertex's
 * score is updated based on the weights of its tags defined in the provided
 * configuration. Each vertex maintains a history of changes.
 *
 * @param vertices An array of vertices to which the weights will be applied.
 * @param [config] Config containing the weights for specific tags.
 * @returns the mutated vertices with updated scores and weights.
 */
export function applyTagWeights(vertices: Vert[], config?: Config) {
	const tagWeights = config?.weight?.tags ?? {};

	return vertices.map((vertex) => {
		const allTags = vertex.ngram.flatMap((term) => [...(term.tags ?? [])]);
		const tags = allTags.filter((tag) => tag in tagWeights);
		const totalWeight = tags.reduce((sum, tag) => sum + tagWeights[tag], 0);

		vertex.weights.push(['current', vertex.score]);
		const updatedScore = vertex.score + totalWeight;

		vertex.score = updatedScore;
		vertex.weights.push(['tag', vertex.score]);
		return vertex;
	});
}

/**
 * Dedupe a presorted list of vertices and return an array of scores.
 * @params vertices A sorted array of scored vertices
 * @returns An array of terms and scores
 */
export function getScores(vertices: Vert[]): Scores {
	const scores = vertices
		.reduce<Map<string, number>>((map, vert) => {
			if (!map.has(vert.val)) map.set(vert.val, vert.score);
			return map;
		}, new Map());
	return Array.from(scores);
}

function topkResults(feature: Scores, percent = 10): Scores {
	const decimal = percent * .01;
	const count = Math.round(feature.length * decimal);
	return feature.slice(0, count);
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

	const configFile = cli.config;
	let config: Config = {};
	if (cli.config) {
		const [, yaml] = await readFile(configFile);
		config = parseYaml<Config>(yaml);
	}

	const [, text] = await readFile(file);
	const data = parseText<FileAttrs>(text);

	return { data, config };
}

export async function main() {
	const { data, config } = await parseArguments();
	const results = keywordClassic(data, config);

	// const print: Print = {
	// 	attrs: json.attrs ?? {},
	// 	scores: topkResults(results.terms, +cli.topk),
	// };
	console.table(results.scoredKeywords);
	console.table(results.scoredNgrams);

	// console.log(JSON.stringify(print, null, '    '));
	// onsole.table(topkResults(results.scores, +cli.topk));
}

if (import.meta.main) {
	main();
}
