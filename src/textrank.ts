/**
 * Textrank Algorithm Implementation
 * @see Mihalcea, Rada, and Tarau, Paul. (2004). _TextRank: Bringing Order 
 *     into Text._ Association for Computational Linguistics.
 * @see https://web.eecs.umich.edu/~mihalcea/papers/mihalcea.emnlp04.pdf
 */

import { Vert } from './vert.ts';
import { Weights, Ngram } from './types.d.ts';
import { ExtractionStrategy } from './extraction_strategy.ts';

export const DAMPEN = .85;

/**
 * Implementation of the Textrank algorithm. The strategy pattern is
 * used to direct whether we are ranking keywords/co-references or
 * sentences/similarity.
 */
export class Textrank {
  constructor(public extractionStrategy: ExtractionStrategy) {}

	extractData(ngrams: Ngram[]): Vert[] {
		const graphData = this.createGraph(ngrams);
		const { vertices, adj } = graphData;
		this.extractionStrategy.collect(graphData);
		this.scoreVertices(vertices, adj);
		return this.sortResult(vertices);
	}

	createGraph(ngrams: Ngram[]) {
		const corpus: Map<string, number> = new Map();
		const vertices: Vert[] = []; // indices are ids
		const tokenVec: number[] = [];

		for (const ngram of ngrams) {
			const text = this.extractionStrategy.transform(ngram);
			let id = corpus.get(text);
			if (id === undefined) {
				id = corpus.size;
				corpus.set(text, id);
				const vert = new Vert(id, text);
				vert.ngram = ngram;
				vertices.push(vert);
			}
			tokenVec.push(id);
		}

		// Initialize a sparse adjacency matrix - stores the number of occurances of an edge.
		const adj: number[][] = [];
		for (let i = 0; i < corpus.size; i++) adj[i] = [];
		return { tokenVec, vertices, adj };
	}


	scoreVertices(vertices: Vert[], adj: number[][]) {
		const threshhold = 0.0001;
		const maxIterations = 100;

		let converged = 0;
		let iterations = 0;

		while (converged < vertices.length && iterations < maxIterations) {
			converged = 0;
			iterations++;
			const scores = Array(vertices.length);
			for (let i = 0; i < vertices.length; i++) {
				const vi = vertices[i];
				const prev = vi.score;
				scores[i] = this.weightedScore(adj, vi);
				const errRate = scores[i] - prev;
				if (errRate <= threshhold) {
					converged++;
				}
			}

			// Update all scores
			scores.forEach((score, i) => vertices[i].score = score);
		}
	}

	sortResult(vertices: Vert[]) {
		return vertices.toSorted((a, b) => b.score - a.score);
	}

	weightedScore(weights: Weights, vert: Vert): number {
		let sum = 0;
		for (const inbound of vert.inbound) {
			let denom = 0;
			for (const outbound of inbound.outbound) {
				denom += weights[inbound.id][outbound.id];
			}

			// Skip if there are no outbound vertices, avoiding division by zero
			if (denom === 0) continue;
			sum += (weights[inbound.id][vert.id] / denom) * inbound.score;
		}

		// Return the score, but wait until after convergence to set it.
		const score = (1 - DAMPEN) + (DAMPEN * sum);
		return score;
	}
}
