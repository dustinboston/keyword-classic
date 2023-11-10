import { Vert } from './vert.ts';
export { View, Document } from './deps.ts';

export type Weights = number[][];

export type GraphData = {
	vertices: Vert[]; // indices are ids
	tokenVec: number[];
	adj: number[][];
};

export type Term = {
  text: string,
  pre: string,
  post: string,
  normal: string,
  tags?: Set<string>,
  index?: [n?: number, start?: number],
  id?: string,
  chunk?: string,
  dirty?: boolean
  syllables?: string[],
}

export type DocumentMetadata = { 
  text: string;
  terms: Term[];
}

// export type TermSet = {
// 	id: string;
// 	termLists: Term[][];
// };
//
//
// export type Document = TermSet;

export type Corpus = string[][];
export type Frequencies = Map<string, number>;

export type Config = Partial<{
	keywords?: string[];
	weight: {
		tags: Record<string, number>;
	};
	ignore: {
		tags: string[];
	};
	extend: {
		tags: Record<string, Record<string, string>>;
		words: Record<string, string>;
	};
}>;


export type AggregateScores = Map<string, DistanceScore[]>;
export type DistanceScore = {
	/** Coordinates of term A. A[0] is the set index, and A[1] is the termList index. */
	aCoord: string;
	/** Terms from aCoord joined with a comma */
	aTerm: string;
	/** Coordinates of term B. B[0] is the set index, and B[1] is the termList index. */
	bCoord: string;
	/** Terms from aCoord joined with a comma */
	bTerm: string;
	/** The actual edit distance between aTerm and bTerm */
	distance: number;
	/** the normalized edit distance between aTerm and bTerm */
	score: number;
};


export type Ngram = Term[];

/**
 * An ordered list of keywords with scores.
 */
export type Scores = [string, number][];

/**
 * Attributes obtained from parsing the document front-matter.
 */
export type FileAttrs = Record<string, unknown> & Partial<{
  company: string;
  industry: string;
  position: string;
  keywords: string[];
}>;

/**
 * Result of parsing the document fetched from the CLI.
 */
export type InputFile = {
	attrs: FileAttrs;
	body: string;
};

export type ParsedYaml<T> = { attrs: T; body: string };

/**
 * Print this data to the console.
 */
export type Print = {
	attrs: FileAttrs;
	scores: [string, number][];
};



export interface SimilarityScore {
	aIndex: number;
	bIndex: number;
	aTerm: string;
	bTerm: string;
	score: number;
  scoreHistory: [string, number][];
}

export interface EditSimilarityScore extends SimilarityScore {
	editDistance: number;
	editSimilarity: number;
}

export interface IntersectionScore extends EditSimilarityScore {
	intersectionWeight: number;
}

export interface Annotations {
	id: string;
	values: string[];
}

export interface AnnotationAttrs {
	annotations: Annotations[];
}

export interface AnnotationFile {
	attrs: AnnotationAttrs;
	body: string;
}
