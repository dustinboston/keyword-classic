import { nlp, Term, View as CompromiseView, StatsMethods } from './deps.ts';

export type View = CompromiseView & StatsMethods;

export type TextrankScores = Map<string, number>;
export type TextrankTerm = Term & { rank: number; terms: Term[] };

export interface TextrankMethods {
	textrank: (this: View) => TextrankScores;
	textrankNgrams: (this: View, maxSize?: number, minSize?: number) => TextrankScores;
}

export type TextrankView = View & TextrankMethods;
export type TextrankProto = View & { prototype: TextrankMethods };

export type nlpTextrank = nlp.TypedPlugin<TextrankMethods>;
export type TextrankPlugin = nlpTextrank;
