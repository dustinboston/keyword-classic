import type { StatsMethods } from 'https://esm.sh/compromise-stats@0.1.0';
import View from 'https://esm.sh/v132/compromise@14.10.0/types/view/three.d.ts';
import { TextrankMethods } from './textrank_plugin.ts';

/**
 * Adds plugin methods to the regular view.
 */
export type PluginView = View & StatsMethods & TextrankMethods;

/**
 * An ordered list of keywords with scores.
 */
export type ScoredResult = [string, number][];

/**
 * The list of features that will be extracted.
 */
export type Features = {
	ngrams: ScoredResult;
	tfidf: ScoredResult;
	textrank: ScoredResult;
};

/**
 * Attributes obtained from parsing the document front-matter.
 */
export type DocumentAttributes = Record<string, unknown>;

/**
 * Result of parsing the document fetched from the CLI.
 */
export type ParsedDocument = {
	attrs: DocumentAttributes;
	body: string;
};

/**
 * Command line flags - the document should be a path passed
 * as the very last argument.
 */
export type CommandLineFlags = {
	[x: string]: unknown;
	a?: 'all' | 'textrank' | 'tfidf' | 'ngrams';
	l?: number;
	algo: 'all' | 'textrank' | 'tfidf' | 'ngrams';
	limit: number;
	_: string[]; // The document path should be here
};
