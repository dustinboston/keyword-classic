import { assertEquals, compromise, stats, StatsMethods } from './deps.ts';
import { textrank, sentenceRank, Vert, Weights, weightedScore, DAMPEN } from '../src/plugin/textrank.ts';
import textrankPlugin from '../src/plugin/textrank_plugin.ts';
import type { TextrankMethods } from '../src/plugin/types.d.ts';
import { preliminaries } from '../src/keyword_classic.ts';

compromise.plugin(stats);
compromise.plugin(textrankPlugin);

Deno.test('Direct textrank usage', () => {
	const tokens = 'around and around and around'.split(' ');
	const result = textrank(tokens);
	assertEquals(result.length, 2);
	assertEquals(result[0].val, 'around');
	assertEquals(result[1].val, 'and');
});

Deno.test('Should return a result', () => {
  const text = 'It rained grey slushies in Boston.';
  const doc = compromise<TextrankMethods & StatsMethods>(text);  
  const result = Array.from(doc.textrank());
  assertEquals(result.length, 4);
});

Deno.test('Should throw an error if there are no nouns or adjectives present.', () => {
	const text = 'What goes around, comes around.';
  let caughtError = false;
  try {
    const doc = compromise<TextrankMethods & StatsMethods>(text);  
    doc.textrank(); // will throw because there are no nouns or adjectives
  } catch(_e) {
    caughtError = true;
  }
  assertEquals(caughtError, true);
});

Deno.test('Plugin textrankNgrams() usage', () => {
  const text = `We are able to hire eligible candidates from anywhere in USA.`;
  const doc = preliminaries(text);
	const result = doc.textrankNgrams(3, 1);
  assertEquals(result.size, 12);
});

Deno.test('sentenceRank works with minimal input.', () => {
  const sentences = [ "able hire", "overview", "able", "hire" ];
  const result = sentenceRank(sentences)
		.reduce((map, vert) => {
			if (!map.has(vert.val)) map.set(vert.val, vert.score);
			return map;
		}, new Map());
  assertEquals(result.size, 4)
})

Deno.test("weightedScore should return 0.15 when no inbound vertices", () => {
  const vert = new Vert(0, "word");
  const weights: Weights = [[]];
  const result = weightedScore(weights, vert);
  assertEquals(result.toFixed(2), "0.15");
});

Deno.test("weightedScore should return weighted score based on inbound vertices", () => {
  const vertA = new Vert(0, "wordA");
  const vertB = new Vert(1, "wordB");
  vertA.inbound.push(vertB);
  vertB.outbound.push(vertA);

  const bToAEdgeWeight = 0.5;
  const preCalculatedScoreB = 2;
  vertB.score = preCalculatedScoreB;

  const weights: Weights = [
    [], // for vertA
    [bToAEdgeWeight] // for vertB, pointing to vertA
  ];

  const expectedScore = (1 - DAMPEN) + (DAMPEN * ((bToAEdgeWeight / bToAEdgeWeight) * preCalculatedScoreB));
  const result = weightedScore(weights, vertA);
  assertEquals(result.toFixed(2), expectedScore.toFixed(2));
});

Deno.test("weightedScore should return (1 - DAMPEN) when no inbound or outbound vertices", () => {
  const vert = new Vert(0, "word");
  const weights: Weights = [[]];
  const expectedScore = 1 - DAMPEN;
  const result = weightedScore(weights, vert);
  assertEquals(Number(result.toFixed(2)), Number(expectedScore.toFixed(2)));
});

Deno.test("weightedScore should return (1 - DAMPEN) when inbound but no outbound vertices", () => {
  const vertA = new Vert(0, "wordA");
  const vertB = new Vert(1, "wordB");
  vertA.inbound.push(vertB);
  // No vertB.outbound.push(vertA); 
  const weights: Weights = [
    [], // for vertA
    []  // for vertB
  ];
  const expectedScore = 1 - DAMPEN;
  const result = weightedScore(weights, vertA);
  assertEquals(Number(result.toFixed(2)), Number(expectedScore.toFixed(2)));
});

