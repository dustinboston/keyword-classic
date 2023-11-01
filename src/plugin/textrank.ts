/**
 * Textrank Algorithm Implementation
 * @author Dustin Boston
 * @see Mihalcea, Rada, and Tarau, Paul. (2004). *TextRank: Bringing Order into Text*. (Vol. ). 
 *    Association for Computational Linguistics.
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

/**
 * The threshhold at which two vertices are considered significantly similar.
 * A value of 0 will include all vertices with similarity scores greater than 0.
 */
export const SIMILARITY_THRESHHOLD = 0.1;

export const DAMPEN = .85;

/**
 * Ranks individual tokens using a weighted graph and coreferences.
 * Weighting is based on the number of coreferences - in other words, the 
 * number of times a nearby word occurs next to a given word.
 *
 * @param tokens An array of tokens made from a single word. 
 * @returns the scored and sorted results.
 */
export function textrank(tokens: string[]): Vert[] {
  const { tokenVec, vertices, adj } = createGraph(tokens);
  collectCoreferences(tokenVec, vertices, adj);
  scoreVertices(vertices, adj);
  return sortResult(vertices);
}

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
export function sentenceRank(sentences: string[]): Vert[] {
  const { tokenVec, vertices, adj } = createGraph(sentences);
  collectSimilar(tokenVec, vertices, adj);
  scoreVertices(vertices, adj);
  return sortResult(vertices);
}

export function createGraph(tokens: string[]) {
  const corpus: Map<string, number> = new Map();
  const vertices: Vert[] = []; // indices are ids
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

  // Initialize a sparse adjacency matrix - stores the number of occurances of an edge.
  const adj: number[][] = [];
  for (let i = 0; i < corpus.size; i++) adj[i] = [];
  return { tokenVec, vertices, adj };
}

/**
 * Collects words that are within a fixed window (2) - coreferences.
 * Adds words to the left of the current word as inbound vertices,
 * and words to the right of the current word as outbound vertices.
 */
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

/**
 * Co-occurances cannot be applied to sentences. Instead, we collect 
 * similar sentences based on the amount of overlap between words.
 * @param tokenVec vectorized list of tokens
 * @param vertices list of all vertices in the graph
 * @param adj Adjacency matrix, aka edges
 */
export function collectSimilar(
  tokenVec: number[],
  vertices: Vert[],
  adj: number[][],
) {
  for (let i = 0; i < tokenVec.length; i++)  {
    const aId = tokenVec[i];
    const vertA = vertices[aId];

    for (let j = 0; j < tokenVec.length; j++)  {
      if (i === j) continue;
      const bId = tokenVec[j];
      const vertB = vertices[bId];
      const similarity = calculateSimilarity(vertA.val.split(' '), vertB.val.split(' '));

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
export function calculateSimilarity(a: string[], b: string[]): number {
  const overlap = a.filter(word => b.includes(word)).length;
  return overlap / (Math.log(a.length) + Math.log(b.length)); 
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

export function unweightedScore(vert: Vert) {
  let sum = 0;
  for (const vj of vert.inbound) {
    sum += (1 / vj.outbound.length) * (vj.score);
  }

  vert.score = (1 - DAMPEN) + (DAMPEN * sum);
  return vert.score;
}
