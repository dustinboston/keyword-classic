import { GraphData, Ngram } from './types.d.ts';
import { ExtractionStrategy } from './extraction_strategy.ts';

/**
 * The distance in words that we consider a co-reference
 */
export const COREFERENCE_WINDOW_SIZE = 2;

/**
 * Ranks individual terms using a weighted graph and coreferences.
 * Weighting is based on the number of coreferences - in other words, the
 * number of times a nearby word occurs next to a given word.
 *
 * @param ngrams An array term arrays. ngrams represent sentences.
 * @returns the scored and sorted results.
 */
export class KeywordExtractionStrategy extends ExtractionStrategy {
	constructor(public coreferenceWindowSize = COREFERENCE_WINDOW_SIZE) {
		super();
	}

	transform(ngram: Ngram) {
		return ngram[0].normal;
	}

	/**
	 * collect co-references
	 * Collects words that are within a fixed window (2) - coreferences.
	 * Adds words to the left of the current word as inbound vertices,
	 * and words to the right of the current word as outbound vertices.
	 */
	collect({ tokenVec, vertices, adj }: GraphData) {
		for (let i = 0; i < tokenVec.length; i++) {
			const id = tokenVec[i];
			const vert = vertices[id];

			for (let j = 1; j <= this.coreferenceWindowSize; j++) {
				const nextId = tokenVec[i + j];
				if (nextId !== undefined) {
					// Add the next vertex as an outbound connection to vert
					vert.outbound.push(vertices[nextId]);
					// Add vert as an inbound connection to the next vertex
					vertices[nextId].inbound.push(vert);
					// Add weight based on the number of occurances (term frequency)
					adj[id][nextId] = (adj[id][nextId] ?? 0) + 1;
				}
			}
		}
	}
}
