import { Term, Sentence } from './types.d.ts';

/**
 * sentence structure:
 * [{ terms: [term, term, ...] }, { terms: [term, term, ...]} ]
 */
export function ngrams(sentences: Sentence[], minSize = 1, maxSize = 5) {

	return sentences 
		.reduce<Term[][]>((ngrams, _, i, terms) => [
			...ngrams,
			// gets the current ngram slice
			...(terms as TextrankTerm[]).slice(i, i + maxSize)
				// creates ngrams of length i to maxSize within the slice
				.map((_, j, subTerms) => subTerms.slice(0, j + 1)),
		], [])
		// .flat() // drop the sentence structure
		.map<[string, number]>((ngram) => [
			ngram.map((t) => t.normal).join(' '),
			// average the score so all ngrams are on the same scale
			ngram.reduce((sum, t) => sum + t.rank, 0) / ngram.length,
		])
		.sort((a, b) => b[1] - a[1])
		// deduplicate the ngrams
		.reduce<Map<string, number>>((map, [ngram, score]) => {
			return map.set(ngram, score);
		}, new Map());
}
