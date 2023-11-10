import { assertEquals } from './deps.ts';
import {
	computeIDF,
	computeTF,
	computeTfIdfMatrix,
	TermColumn,
	TfVector,
} from '../src/tf_idf.ts';
import { Corpus } from '../src/types.d.ts';

/*
Some useful test data:

corpus 
[
  ['ngram', 'one'], 
  ['ngram', 'two'], 
  ['ngram', 'three'],
  ['ngram', 'eight'], 
  ['two', 'one'], 
  ['ngram'],
  ['ngram', 'two'], 
  ['eight']
];

terms Map(5) {
  "ngram" => 0,
  "one" => 1,
  "two" => 2,
  "three" => 3,
  "eight" => 4
}

tfs 
[
  [ 1, 1, 0, 0, 0 ],
  [ 1, 0, 1, 0, 0 ],
  [ 1, 0, 0, 1, 0 ],
  [ 1, 0, 0, 0, 1 ],
  [ 0, 1, 1, 0, 0 ],
  [ 1, 0, 0, 0, 0 ],
  [ 1, 0, 1, 0, 0 ],
  [ 0, 0, 0, 0, 1 ]
]

transposed tfs 
[
  [ 1, 1, 1, 1, 0, 1, 1, 0 ],
  [ 1, 0, 0, 0, 1, 0, 0, 0 ],
  [ 0, 1, 0, 0, 1, 0, 1, 0 ],
  [ 0, 0, 1, 0, 0, 0, 0, 0 ],
  [ 0, 0, 0, 1, 0, 0, 0, 1 ]
]

df scores 
[ 6, 2, 3, 1, 2 ]

idf scores:
1.2876820724517808,
2.386294361119891,
1.9808292530117262,
3.0794415416798357,
2.386294361119891

similarity matrix:
  0    1    2    3    4    5    6    7
0 1.00 0.26 0.18 0.23 0.68 0.47 0.26 0.00
1 0.26 1.00 0.21 0.26 0.54 0.55 1.00 0.00
2 0.18 0.21 1.00 0.18 0.00 0.39 0.21 0.00
3 0.23 0.26 0.18 1.00 0.00 0.47 0.26 0.88
4 0.68 0.54 0.00 0.00 1.00 0.00 0.54 0.00
5 0.47 0.55 0.39 0.47 0.00 1.00 0.55 0.00
6 0.26 1.00 0.21 0.26 0.54 0.55 1.00 0.00
7 0.00 0.00 0.00 0.88 0.00 0.00 0.00 1.00

breakdown:
0,1 ngram one -> ngram two: 0.2588281488091952
0,2 ngram one -> ngram three: 0.18320413303646593
0,3 ngram one -> ngram eight: 0.2255177530553173
0,4 ngram one -> two one: 0.6771508628309691
0,5 ngram one -> ngram: 0.4748870950608337
0,6 ngram one -> ngram two: 0.2588281488091952
0,7 ngram one -> eight: 0

1,2 ngram two -> ngram three: 0.2102645400000537
1,3 ngram two -> ngram eight: 0.2588281488091952
1,4 ngram two -> two one: 0.5355034322447702
1,5 ngram two -> ngram: 0.5450309168246379
1,6 ngram two -> ngram two: 1
1,7 ngram two -> eight: 0

2,3 ngram three -> ngram eight: 0.18320413303646593
2,4 ngram three -> two one: 0
2,5 ngram three -> ngram: 0.385784610577799
2,6 ngram three -> ngram two: 0.2102645400000537
2,7 ngram three -> eight: 0

3,4 ngram eight -> two one: 0
3,5 ngram eight -> ngram: 0.4748870950608337
3,6 ngram eight -> ngram two: 0.2588281488091952
3,7 ngram eight -> eight: 0.8800467299778363

4,5 two one -> ngram: 0
4,6 two one -> ngram two: 0.5355034322447702
4,7 two one -> eight: 0

5,6 ngram -> ngram two: 0.5450309168246379
5,7 ngram -> eight: 0

6,7 ngram two -> eight: 0

top terms:
[
  [ [ 0, 4 ], [ "ngram one", "two one" ], 0.6771508628309691 ],
  [ [ 1, 5 ], [ "ngram two", "ngram" ], 0.5450309168246379 ],
  [ [ 2, 5 ], [ "ngram three", "ngram" ], 0.385784610577799 ],
  [ [ 3, 7 ], [ "ngram eight", "eight" ], 0.8800467299778363 ],
  [ [ 4, 6 ], [ "two one", "ngram two" ], 0.5355034322447702 ],
  [ [ 5, 6 ], [ "ngram", "ngram two" ], 0.5450309168246379 ],
  [ [ 6, 7 ], [ "ngram two", "eight" ], 0 ]
]

*/

Deno.test('calculateTf should return TF vectors', () => {
	const corpus = [['term1', 'term2', 'term3']];
	const terms = new Map([['term1', 0], ['term2', 1], ['term3', 2]]);
	const tfVectors = computeTF(corpus, terms);
	const expectedOutput = [[1, 1, 1]];
	assertEquals(tfVectors, expectedOutput);
});

Deno.test('calculateTf should handle empty document', () => {
	const corpus: Corpus = [];
	const terms = new Map();
	const tfVectors = computeTF(corpus, terms);
	const expectedOutput: TfVector[] = [];
	assertEquals(tfVectors, expectedOutput);
});

Deno.test('calculateTf should handle repeated single term', () => {
	const corpus = [['term1', 'term1', 'term1']];
	const terms = new Map([['term1', 0]]);
	const tfVectors = computeTF(corpus, terms);
	const expectedOutput = [[3]];
	assertEquals(tfVectors, expectedOutput);
});

Deno.test('calculateTf should be case sensitive', () => {
	const corpus = [['term1', 'Term1', 'TERM1']];
	const terms = new Map([['term1', 0], ['Term1', 1], ['TERM1', 2]]);
	const tfVectors = computeTF(corpus, terms);
	const expectedOutput = [[1, 1, 1]];
	assertEquals(tfVectors, expectedOutput);
});

Deno.test('calculateIdf should return correct inverse document frequencies', () => {
	const termColumns: TermColumn = new Map([['term1', 0], ['term2', 1]]);
	// document 1: term2 term1, document 2: term1
	const tfVectors = [[1, 2], [1, 0]];
	const idfs = computeIDF(termColumns, tfVectors);
	const expected = [
		[0.6931471805599453, 0.6931471805599453],
		[0.6931471805599453, 0],
	];
	assertEquals(idfs[0][0], expected[0][0]);
	assertEquals(idfs[0][1], expected[0][1]);
	assertEquals(idfs[1][0], expected[1][0]);
	assertEquals(idfs[1][1], expected[1][1]);
});

Deno.test('calculateTfIdf should handle empty corpus', () => {
	const corpus: Corpus = [];
	const tfIdfs = computeTfIdfMatrix(corpus);
	const expected: TfIdfResult = {
		tfIdfVectors: [],
		terms: new Map(),
	};
	assertEquals(tfIdfs, expected);
});

Deno.test('calculateTfIdf with varying document lengths', () => {
	const corpus = [['term1', 'term2', 'term3'], ['term1', 'term2']];
	const { tfIdfVectors, terms } = computeTfIdfMatrix(corpus);

	assertEquals(terms.size, 3);
	assertEquals(tfIdfVectors.length, 2);
	assertEquals(tfIdfVectors[0].length, 3);

	const expected = [
		[0.6931471805599453, 0.6931471805599453, 0.6931471805599453],
		[0.6931471805599453, 0.6931471805599453, 0],
	];
	assertEquals(tfIdfVectors[0][0], expected[0][0]);
});
