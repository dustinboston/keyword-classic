import { Plugin, Term } from './deps.ts';
import { textrank, sentenceRank } from './textrank.ts';
import {
	TextrankProto,
	TextrankScores,
	TextrankTerm,
	TextrankView,
  View
} from './types.d.ts';

/**
 * Get a list of terms to pass to the textrank() function
 * @param doc The doc view
 * @returns A list of tokens
 */
export function tokenize(doc: View): string[] {
	const json: TextrankTerm[] = doc.json({ text: false });
	return json.flatMap((o) => o.terms.map((t) => t.normal));
}

/**
 * Run the textrank algorithm on a filtered list of terms and return a map
 * of scores. The Textrank paper mentions that they had the best results with
 * just Nouns and Adjectives.
 *
 *@todo Apply custom weights to results before sorting
 * @param this A reference to the view
 * @returns A map of scores
 */
export function rank(this: View): TextrankScores {
	const doc = this.match('(#Noun|#Adjective)') as View;  
  if (!doc.length) throw new Error('No nouns or adjectives were present in the text.');
	const tokens = tokenize(doc);
	const results = textrank(tokens)
		.toSorted((a, b) => b.score - a.score)
		.reduce<TextrankScores>((map, vert) => {
			if (!map.has(vert.val)) map.set(vert.val, vert.score);
			return map;
		}, new Map());

	return results;
}

/**
 * Run the sentenceRank algorithm on a list of ngrams.
 *
 * @param this The view to inspect for terms.
 * @param maxSize Max size of an ngram
 * @returns A list of scored ngrams.
 */
export function ngrams(this: View, maxSize = 4, minSize = 1): TextrankScores {
  const ngrams = this.ngrams({ min: minSize, max: maxSize }).map(g => g.normal);

  return sentenceRank(ngrams)
	  .sort((a, b) => b.score - a.score)
		// deduplicate the ngrams
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
	v.prototype.textrank = rank;
	v.prototype.textrankNgrams = ngrams;
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
				const rank = res.get(term.normal) ?? 0;
				term.rank = rank;
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
