import { CompromiseView, StatsMethods } from './deps.ts';
import { TextrankMethods } from './plugin/types.d.ts';

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

export type Sentence = { 
  text: string;
  terms: Term[];
}

/**
 * Adds plugin methods to the regular view.
 */
export type View = CompromiseView & StatsMethods & TextrankMethods;

/**
 * An ordered list of keywords with scores.
 */
export type Scores = [string, number][];

/**
 * Attributes obtained from parsing the document front-matter.
 */
export type FileAttrs = Record<string, unknown>;

/**
 * Result of parsing the document fetched from the CLI.
 */
export type File = {
	attrs: FileAttrs;
	body: string;
};

/**
 * Print this data to the console.
 */
export type Print = {
	attrs: FileAttrs;
	scores: [string, number][];
};
