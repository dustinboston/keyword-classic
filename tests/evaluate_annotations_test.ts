import { assert, assertEquals } from './deps.ts';
import { getInitialScores, } from '../src/evaluate_annotations.ts';
import { Term, TermSet } from '../src/types.d.ts';
import { calculateCosineSimilarity } from '../src/cosine_similarity.ts';
import { assertAlmostEquals } from 'https://deno.land/std@0.200.0/assert/assert_almost_equals.ts';

const mkTerm = (word: string): Term => ({
	text: word,
	pre: '',
	post: '',
	normal: word.toLowerCase().trim(),
	tags: new Set<string>(),
	index: [0, 0],
	id: word,
	chunk: '',
	dirty: true,
});

Deno.test('Non-zero scores for overlapping term sets', () => {
	const termSets: TermSet[] = [
		{
			id: 'foo',
			termLists: [[mkTerm('word1'), mkTerm('word2')], [mkTerm('word3')]],
		},
		{
			id: 'bar',
			termLists: [[mkTerm('word2'), mkTerm('word3')], [mkTerm('word1')]],
		},
	];

	const scores = getInitialScores(termSets);
  assertAlmostEquals(scores[0][0].score, .5, .1, '0,0 is not almost .5');
  assertAlmostEquals(scores[0][1].score, .7, .1, '0,1 is not almost .7');
  assertAlmostEquals(scores[0][2].score, .7, .1, '0,2 is not almost .7');
  assertAlmostEquals(scores[0][3].score, .0, .1, '0,3 is not almost .0');
});

Deno.test('Zero score for distinct term sets', () => {
	const termSets: TermSet[] = [
		{ id: 'foo', termLists: [[mkTerm('word1'), mkTerm('word2')]] },
		{ id: 'bar', termLists: [[mkTerm('word3'), mkTerm('word4')]] },
	];

	const scores = getInitialScores(termSets).flat(2);
  assertAlmostEquals(scores[0].score, 0, void 0, 'score is not 0');
});

Deno.test('Handle empty term sets', () => {
	const termSets: TermSet[] = [
		{ id: 'foo', termLists: [[]] },
		{ id: 'bar', termLists: [[mkTerm('word1')]] },
	];
	const scores = getInitialScores(termSets).flat(2);
  assertAlmostEquals(scores[0].score, 0, void 0, 'score is not 0');
});

Deno.test('Data integrity with case and whitespace', () => {
	const termSets: TermSet[] = [
		{ id: 'foo', termLists: [[mkTerm('Word1 '), mkTerm('word2')]] },
		{ id: 'bar', termLists: [[mkTerm('word1'), mkTerm('word2 ')]] },
	];
	const scores = getInitialScores(termSets).flat(2);
  assertAlmostEquals(scores[0].score, 1, void 0, 'score is not 1');
});

Deno.test('Validate score calculation', () => {
	const termSets: TermSet[] = [
		{
			id: 'foo',
			termLists: [[mkTerm('word1'), mkTerm('word2')], [mkTerm('word3')]],
		},
		{
			id: 'bar',
			termLists: [[mkTerm('word1')], [mkTerm('word2'), mkTerm('word3')]],
		},
	];
	const scores = getInitialScores(termSets);
	assertAlmostEquals(scores[0][0].score, .7, .1);
	assertAlmostEquals(scores[0][1].score, .5, .1);
	assertAlmostEquals(scores[0][2].score, .0, .1);
	assertAlmostEquals(scores[0][3].score, .7, .1);
});

