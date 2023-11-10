import { Ngram, GraphData } from './types.d.ts';
import { ExtractionStrategy } from './extraction_strategy.ts';
/**
 * The threshhold at which two vertices are considered significantly similar.
 * A value of 0 will include all vertices with similarity scores greater than 0.
 */
export const SIMILARITY_THRESHHOLD = 0.1;

/**
 * Rank sentences, phrases, or ngrams where there is more than a single word.
 * In this case we cannot use co-occurances to weight the graph. Instead we
 * collect similar sentences using a simple function which calculates the amount
 * of overlap between two sentences. The only difference between textrank and
 * sentenceRank is the collection function. Graph creation, scoring, and
 * sorting remain the same.
 *
 * @param sentences An array of sentences with more than one word.
 * @returns the scored and sorted results.
 */
export class NgramExtractionStrategy extends ExtractionStrategy {
	constructor() {
		super();
	}

	transform(ngram: Ngram) {
		return ngram.map((n) => n.normal).join(' ');
	}

	/**
	 * collect similar
	 * Co-occurances cannot be applied to sentences. Instead, we collect
	 * similar sentences based on the amount of overlap between words.
	 * @param tokenVec vectorized list of tokens
	 * @param vertices list of all vertices in the graph
	 * @param adj Adjacency matrix, aka edges
	 */
	collect({ tokenVec, vertices, adj }: GraphData) {
		for (let i = 0; i < tokenVec.length; i++) {
			const aId = tokenVec[i];
			const vertA = vertices[aId];

			for (let j = 0; j < tokenVec.length; j++) {
				if (i === j) continue;
				const bId = tokenVec[j];
				const vertB = vertices[bId];
				const similarity = this.calculateSimilarity(
					vertA.val.split(' '),
					vertB.val.split(' '),
				);

				// A threshhold is defined to reduce the amount of processing.
				// The current thresshold is anything greater than 0 which means there must be
				// at least _some_ similarity between the sentences.
				if (similarity >= SIMILARITY_THRESHHOLD) {
					// Add initial weight based on similarity
					adj[aId][bId] = similarity;
					// Add b as an outbound connection to A
					vertA.outbound.push(vertB);
					// Add a as an inbound connection to B
					vertB.inbound.push(vertA);
				}
			}
		}
	}

	/**
	 * Calculate the normalized overlap between each ngram.
	 * @param a The first sentence (ngram, phrase), an array of words
	 * @param b The second sentence (ngram, phrase), an array of words
	 * @returns The normalized similarity score
	 */
	calculateSimilarity(a: string[], b: string[]): number {
		const overlap = a.filter((word) => b.includes(word)).length;
		return overlap / (Math.log(a.length) + Math.log(b.length));
	}
}
