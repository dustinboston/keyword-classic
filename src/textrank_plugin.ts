import View from 'https://esm.sh/v132/compromise@14.10.0/types/view/one.d.ts';
import {
	Plugin,
	Term,
} from 'https://esm.sh/v132/compromise@14.10.0/types/misc.d.ts';
import nlp from 'https://esm.sh/v132/compromise@14.10.0/types/three.d.ts';

export type TextrankScores = Map<string, number>;
export type TextrankTerm = Term & { rank: number; terms: Term[] };

export interface TextrankMethods {
	textrank: (this: View) => TextrankScores;
	textrankNgrams: (this: View, maxSize?: number) => TextrankScores;
}

export type TextrankView = View & TextrankMethods;
export type TextrankProto = View & { prototype: TextrankMethods };

export type nlpTextrank = nlp.TypedPlugin<TextrankMethods>;
export type TextrankPlugin = nlpTextrank;

/**
 * Get a list of terms to pass to the textrank() function
 * @param doc The doc view
 * @returns A list of tokens
 */
export function tokenize(doc: View): string[] {
	const json: TextrankTerm[] = doc.json({ text: false });
	return json.flatMap((o) => o.terms.map((t) => t.normal));
}

export function getNgrams(
	this: View,
	maxSize: number | undefined = 3,
): TextrankScores {
	this.compute('textrank');

	// using sentences() prevents cross-sentence ngrams, e.g. "team. We work"
	return this.termList()
		.reduce<TextrankTerm[][]>((ngrams, _, i, terms) => [
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

export function getWords(this: View): TextrankScores {
	const tokens = tokenize(this);
	return textrank(tokens)
		.toSorted((a, b) => b.score - a.score)
		.reduce<TextrankScores>((map, vert) => {
			if (!map.has(vert.val)) map.set(vert.val, vert.score);
			return map;
		}, new Map());
}

/**
 * Add the textrank() method to the View
 * @param V a to extend with the textrank() method
 */
export function addMethod(view: TextrankView) {
	const v = view as TextrankView & TextrankProto;
	v.prototype.textrank = getWords;
	v.prototype.textrankNgrams = getNgrams;
}

export const compute = {
	/**
	 * Writes the textrank scores to the term objects.
	 * @param view A view extended with the textrank function.
	 */
	textrank: (view: TextrankView) => {
		const res = view.textrank();
		view.docs.forEach((terms: Term[]) => {
			terms.forEach((t: Term) => {
				const term = t as TextrankTerm;
				const rank = res.get(term.normal);
				if (rank !== undefined) {
					term.rank = rank;
					if (!term.tags) term.tags = new Set<string>();
					term.tags.add('Textrank');
				}
			});
		});
	},
};

const plugin: Plugin = {
	compute,
	api(fn: unknown) {
		// The api interface is wrong. `fn: unknown` should be `view: View`
		const view = fn as View;
		addMethod(view as TextrankView);
	},
};

export default plugin;

// -----------------------------------------------------------------------------

/**
 * Textrank Algorithm Implementation
 * @author Dustin Boston
 * @see https://web.eecs.umich.edu/~mihalcea/papers/mihalcea.emnlp04.pdf
 */

export type Weights = number[][];
export class Vert {
	constructor(
		public id: number,
		public val: string,
		public inbound: Vert[] = [],
		public outbound: Vert[] = [],
		public score = 1,
	) {}
}

export function textrank(tokens: string[]) {
	const { tokenVec, vertices, adj } = createGraph(tokens);
	collectCoreferences(tokenVec, vertices, adj);
	scoreVertices(vertices, adj);
	return sortResult(vertices);
}

export function createGraph(tokens: string[]) {
	const corpus: Map<string, number> = new Map();
	const vertices: Vert[] = Array(corpus.size); // indices are ids
	const tokenVec: number[] = [];

	for (const token of tokens) {
		let id = corpus.get(token);
		if (id === undefined) {
			id = corpus.size;
			corpus.set(token, id);
			vertices.push(new Vert(id, token));
		}
		tokenVec.push(id);
	}

	// Sparse adjacency matrix - stores the number of occurances of an edge.
	const adj: number[][] = [];
	for (let i = 0; i < corpus.size; i++) {
		adj[i] = [];
	}
	return { tokenVec, vertices, adj };
}

export function collectCoreferences(
	tokenVec: number[],
	vertices: Vert[],
	adj: number[][],
) {
	const windowSize = 2;
	for (let i = 0; i < tokenVec.length; i++) {
		const id = tokenVec[i];
		const vert = vertices[id];

		for (let j = 1; j <= windowSize; j++) {
			const nextId = tokenVec[i + j];
			if (nextId !== undefined) {
				vert.outbound.push(vertices[nextId]);
				vertices[nextId].inbound.push(vert);
				adj[id][nextId] = (adj[id][nextId] ?? 0) + 1;
			}
		}
	}
}

export function scoreVertices(vertices: Vert[], adj: number[][]) {
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
			scores[i] = weightedScore(adj, vi);
			const errRate = scores[i] - prev;
			if (errRate <= threshhold) {
				converged++;
			}
		}

		// Update all scores
		scores.forEach((score, i) => vertices[i].score = score);
	}
}

export function sortResult(vertices: Vert[]) {
	return vertices.toSorted((a, b) => b.score - a.score);
}

export function weightedScore(weights: Weights, vert: Vert): number {
	const dampen = 0.85;
	let sum = 0;
	for (const inbound of vert.inbound) {
		let denom = 0;
		for (const outbound of inbound.outbound) {
			denom += weights[inbound.id][outbound.id];
		}
		sum += (weights[inbound.id][vert.id] / denom) * inbound.score;
	}

	// return the score but don't set it.
	// This must be done after we check for convergence.
	const score = (1 - dampen) + (dampen * sum);
	return score;
}

export function unweightedScore(vert: Vert) {
	const dampen = .85;
	let sum = 0;
	for (const vj of vert.inbound) {
		sum += (1 / vj.outbound.length) * (vj.score);
	}

	vert.score = (1 - dampen) + (dampen * sum);
	return vert.score;
}
