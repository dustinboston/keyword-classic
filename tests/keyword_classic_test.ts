import { Config, Term, DocumentMetadata } from '../src/types.d.ts';
import {
	assert,
	assertEquals,
	assertThrows,
} from './deps.ts';
import {
	applyTagWeights,
	keywordClassic,
	extractDocument,
	preliminaries,
	recontextualizeTerms,
} from '../src/keyword_classic.ts';
import { Vert } from '../src/vert.ts';

// For preset heavy [1]
// -----------------------------------------------------------------------------

function getHeavyTest(text: string) {
	const metadata = preliminaries(text);
	const result = extractDocument(metadata);
	if (result.length) {
		return result[0].map((t) => t.text).join(' ');
	} else {
		return '';
	}
}

type TermIndex = [n?: number | undefined, start?: number | undefined];
function makeTerm(
	text: string,
	index: TermIndex = [],
	tags: string[] = [],
): Term {
	const normal = text;
	return { text, pre: '', post: '', normal, tags: new Set(tags), index };
}

Deno.test('Convert ASCII', () => {
	const term = getHeavyTest('brûnçh');
	assertEquals(term, 'brunch');
});

Deno.test('Convert plural to singular', () => {
	const term = getHeavyTest('cats');
	assertEquals(term, 'cat');
});

Deno.test('Convert verbs to infinitives', () => {
	const term = getHeavyTest('running');
	assertEquals(term, 'run');
});

Deno.test('Convert upper to lower', () => {
	const term = getHeavyTest('LOUD');
	assertEquals(term, 'loud');
});

Deno.test('Expand contractions', () => {
	const term = getHeavyTest(`there'd`);
	assertEquals(term, 'there would');
});

Deno.test('Remove commas', () => {
	const term = getHeavyTest('remove, commas');
	assertEquals(term, 'remove commas');
});

Deno.test('Remove semicolons', () => {
	const term = getHeavyTest('remove; semicolons');
	assertEquals(term, 'remove semicolons');
});

Deno.test('Remove hyphens', () => {
	const term = getHeavyTest('remove-hyphen');
	assertEquals(term, 'remove hyphen');
});

Deno.test('Newlines become metadata', () => {
	const metadata = preliminaries('remove\nnewline');
	const result = extractDocument(metadata);
	assertEquals(result.length, 2);
});

Deno.test('Remove periods from acronyms', () => {
	const term = getHeavyTest('U.S.A.');
	assertEquals(term, 'usa');
});

Deno.test('Remove Emoji', () => {
	const term = getHeavyTest('🙂');
	assertEquals(term, '');
});

Deno.test('Remove bullets', () => {
	const term = getHeavyTest('* bullet');
	assertEquals(term, 'bullet');
});

Deno.test('Remove possessives', () => {
	const term = getHeavyTest('John\'s');
	assertEquals(term, 'john');
});

Deno.test('Remove adverbs', () => {
	const term = getHeavyTest('quickly');
	assertEquals(term, '');
});

Deno.test('Remove honorifics', () => {
	const term = getHeavyTest('Mr. John');
	assertEquals(term, 'john');
});

Deno.test('Remove parentheses', () => {
	const term = getHeavyTest('hello (world)');
	assertEquals(term, 'hello world');
});

Deno.test('Removes brackets', () => {
	const term = getHeavyTest('hello [world]');
	assertEquals(term, 'hello world');
});

Deno.test('Removes braces', () => {
	const term = getHeavyTest('hello {world}');
	assertEquals(term, 'hello world');
});

Deno.test('Remove quotes', () => {
	const term = getHeavyTest('"hello"');
	assertEquals(term, 'hello');
});

Deno.test('Remove extra spaces', () => {
	const term = getHeavyTest('hello  world');
	assertEquals(term, 'hello world');
});

// recontextualizeTerms
// --------------------------------------------------------------------------

Deno.test('recontextualizeTerms should throw for empty ngram', () => {
	const vert = [new Vert(1, 'test', [], [], 1, [])];
	assertThrows(() => recontextualizeTerms(vert, []));
});

Deno.test('recontextualizeTerms should handle single-term ngram', () => {
	const term: Term = { text: 'apple', pre: '', post: '', normal: 'apple' };
	const vert = [new Vert(1, 'test', [], [], 1, [term])];
	const result = recontextualizeTerms(vert, []);
	assertEquals(result[0].val, 'apple');
});

Deno.test('recontextualizeTerms should handle undefined indices', () => {
	const term1: Term = { text: 'apple', pre: '', post: '', normal: 'apple' };
	const term2: Term = { text: 'banana', pre: '', post: '', normal: 'banana' };
	const vert = [new Vert(1, 'test', [], [], 1, [term1, term2])];
	const result = recontextualizeTerms(vert, []);
	assertEquals(result[0].val, 'test');
});

Deno.test('recontextualizeTerms should handle invalid metadata index', () => {
	const term: Term = {
		text: 'apple',
		pre: '',
		post: '',
		normal: 'apple',
		index: [10],
	};
	const vert = [
		new Vert(1, 'test', [], [], 1, [term, structuredClone(term)]),
	];
	const result = recontextualizeTerms(vert, []);
	assertEquals(result[0].val, 'test');
});

Deno.test('recontextualizeTerms should handle invalid start/end indices', () => {
	const term1: Term = {
		text: 'apple',
		pre: '',
		post: '',
		normal: 'apple',
		index: [0],
	};
	const term2: Term = {
		text: 'banana',
		pre: '',
		post: '',
		normal: 'banana',
		index: [10],
	};
	const metadata: DocumentMetadata = { text: 'apple banana', terms: [term1, term2] };
	const vert = [new Vert(1, 'test', [], [], 1, [term1, term2])];
	const result = recontextualizeTerms(vert, [metadata]);
	assertEquals(result[0].val, 'test');
});

Deno.test(
	'recontextualizeTerms should update vertex value with terms',
	() => {
		const term1: Term = {
			text: 'apple',
			pre: '',
			post: '',
			normal: 'apple',
			index: [0, 0],
		};
		const term2: Term = {
			text: 'banana',
			pre: '',
			post: '',
			normal: 'banana',
			index: [0, 1],
		};
		const metadata: DocumentMetadata = {
			text: 'apple banana',
			terms: [term1, term2],
		};
		const vert = [new Vert(1, 'test', [], [], 1, [term1, term2])];
		const result = recontextualizeTerms(vert, [metadata]);
		assertEquals(result[0].val, 'apple banana');
	},
);

// applyTagWeights
// ---------------------------------------------------------------------------

Deno.test('applyTagWeights with empty vertices array', () => {
	const vertices: Vert[] = [];
	applyTagWeights(vertices);
	assertEquals(vertices.length, 0);
});

Deno.test('applyTagWeights with undefined config', () => {
	const vertices: Vert[] = [new Vert(1, 'test')];
	applyTagWeights(vertices);
	assertEquals(vertices[0].score, 1);
});

Deno.test('applyTagWeights with empty ngram array', () => {
	const vertices: Vert[] = [new Vert(1, 'test', [], [], 1, [])];
	applyTagWeights(vertices);
	assertEquals(vertices[0].score, 1);
});

Deno.test('applyTagWeights with ngram without tags', () => {
	const vertices: Vert[] = [
		new Vert(1, 'test', [], [], 1, [makeTerm('hello')]),
	];
	applyTagWeights(vertices);
	assertEquals(vertices[0].score, 1);
});

Deno.test('applyTagWeights with ngram having unmatched tags', () => {
	const config: Config = { weight: { tags: { 'A': 2 } } };
	const vertices: Vert[] = [
		new Vert(1, 'test', [], [], 1, [makeTerm('hello', [], ['B'])]),
	];
	applyTagWeights(vertices, config);
	assertEquals(vertices[0].score, 1);
});

Deno.test('applyTagWeights with ngram having matched tags', () => {
	const config: Config = { weight: { tags: { 'A': 2 } } };
	const vertices: Vert[] = [
		new Vert(1, 'test', [], [], 1, [makeTerm('hello', [], ['A'])]),
	];
	applyTagWeights(vertices, config);
	assert(vertices[0].score > 1);
});

Deno.test('applyTagWeights with ngram having mixed tags', () => {
	const config: Config = { weight: { tags: { 'A': 2, 'C': 3 } } };
	const vertices: Vert[] = [
		new Vert(1, 'test', [], [], 1, [
			makeTerm('hello', [], ['A', 'B']),
			makeTerm('word', [], ['C']),
		]),
	];
	applyTagWeights(vertices, config);
	assert(vertices[0].score > 1);
});

Deno.test('verify weights history is maintained correctly', () => {
	// Create a Vert with specific ngram
	const term: Term = makeTerm('example', [], ['tag1']);
	const vertex = new Vert(1, 'vertex', [], [], 1, [term]);

	// Define two different configurations
	const config1: Config = { weight: { tags: { 'tag1': 2 } } };
	const config2: Config = { weight: { tags: { 'tag1': 3 } } };

	// Apply first configuration
	applyTagWeights([vertex], config1);
	const firstScore = vertex.score;

	// Apply second configuration
	applyTagWeights([vertex], config2);
	const secondScore = vertex.score;

	// Check if weights array has 4 entries (2 per application)
	assertEquals(vertex.weights.length, 4);

	// Check if history and new scores are correct
	assertEquals(vertex.weights[0], ['current', 1]);
	assertEquals(vertex.weights[1], ['tag', firstScore]);
	assertEquals(vertex.weights[2], ['current', firstScore]);
	assertEquals(vertex.weights[3], ['tag', secondScore]);

	// Check if the current score is updated correctly
	assertEquals(vertex.score, secondScore);
});

Deno.test('verify that Vert scores are updated correctly', () => {
	// Create Verts with specific ngram
	const term1: Term = makeTerm('word1', [], ['tag1']);
	const vertex1 = new Vert(1, 'vertex1', [], [], 10, [term1]);

	const term2: Term = makeTerm('word2', [], ['tag2']);
	const vertex2 = new Vert(2, 'vertex2', [], [], 5, [term2]);

	// Define configuration with weights
	const config: Config = { weight: { tags: { 'tag1': 2, 'tag2': 3 } } };

	// Apply weights
	const updatedVertices = applyTagWeights([vertex1, vertex2], config);

	// Check if scores are updated correctly
	assertEquals(updatedVertices[0].score, 12);
	assertEquals(updatedVertices[1].score, 8);
});

Deno.test('Tags can be set from config options', () => {
	const config = {
		weight: {
			tags: {
				Cookie: 1,
			},
		},
		extend: {
			tags: {
				Cookie: {
					isA: 'ProperNoun',
				},
			},
			words: {
				oreo: 'Cookie',
			},
		},
	};
	const text = 'Eat an Oreo.';
	const unweighted = keywordClassic(text);
	const weighted = keywordClassic(text, config);

	assertEquals(unweighted.scores[0][1].toFixed(2), '0.15');
	assertEquals(weighted.scores[0][1].toFixed(2), '1.15');
});
