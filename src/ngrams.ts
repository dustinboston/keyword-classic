import { Term, Ngram } from './types.d.ts';

/**
 * Convert a sentence into ngrams. Isolates ngrams to their respective sentences.
 *
 * @param termLists An array of Sentence objects which contain Terms
 * @param minSize the smallest allowed ngram length
 * @param maxSize the largest allowed ngram length
 * @returns an array of ngrams
 */
export function getNgrams(termLists: Term[][], minSize = 2, maxSize = 5): Ngram[] {
	return termLists 
    .flatMap((termList) => termList
      .reduce<Ngram[]>((ngrams, _, i, terms) => [
        ...ngrams,
        // gets the current ngram slice
        ...(terms as Term[]).slice(i, i + maxSize)
          // creates ngrams of length i to maxSize within the slice
          .map((_, j, subTerms) => subTerms.slice(0, j + 1)),
      ], [])
    )
    .filter((ngram) => ngram.length >= minSize);
}
