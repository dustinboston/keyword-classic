import { assertEquals } from './deps.ts';
import { extractDocument, preliminaries } from '../src/keyword_classic.ts';
import { getNgrams } from '../src/ngrams.ts';

// Removed manually [2]
// -----------------------------------------------------------------------------

function testFilterTags(value: string) {
	const metadata = preliminaries(value);
  const result = extractDocument(metadata);
	return result[0];
}

Deno.test('Remove NumericValue', () => {
	const result = testFilterTags('123');
	assertEquals(result.length, 0);
});

Deno.test('Doesn\'t remove a spelled-out NumericValue', () => {
	const result = testFilterTags('one');
	assertEquals(result.length, 1);
	assertEquals(result[0].text, 'one');
});

Deno.test('Remove Money', () => {
	const result = testFilterTags('$100');
	assertEquals(result.length, 0);
});

Deno.test('Remove Fraction', () => {
	const result = testFilterTags('1/2');
	assertEquals(result.length, 0);
});

Deno.test('Remove Percent', () => {
	const result = testFilterTags('50%');
	assertEquals(result.length, 0);
});

Deno.test('Remove PhoneNumber', () => {
	const result = testFilterTags('123-456-7890');
	assertEquals(result.length, 0);
});

Deno.test('Remove Date', () => {
	const result = testFilterTags('2021-10-10');
	assertEquals(result.length, 0);
});

// Remove stopwords with POS [3]
// -----------------------------------------------------------------------------

Deno.test('Remove Determiner', () => {
	const result = testFilterTags('the cat');
	assertEquals(result.length, 1);
	assertEquals(result[0].text, 'cat');
});

Deno.test('Remove Preposition', () => {
	const result = testFilterTags('bad at golf');
	assertEquals(result.length, 2);
	assertEquals(result[0].text, 'bad');
	assertEquals(result[1].text, 'golf');
});

Deno.test('Remove Conjunction', () => {
	const result = testFilterTags('apple and orange');
	assertEquals(result.length, 2);
	assertEquals(result[0].text, 'apple');
	assertEquals(result[1].text, 'orange');
});

Deno.test('Remove Pronoun', () => {
	const result = testFilterTags('he she');
	assertEquals(result.length, 0);
});

Deno.test('Remove Copula', () => {
	const result = testFilterTags('is are');
	assertEquals(result.length, 0);
});

// Remove web markup [4]
// NOTE: remove emoji is tested above
// -----------------------------------------------------------------------------

Deno.test('Remove Url', () => {
	const result = testFilterTags('https://example.com');
	assertEquals(result.length, 0);
});

Deno.test('Remove unsecured Url', () => {
	const result = testFilterTags('http://example.com');
	assertEquals(result.length, 0);
});

Deno.test('Remove Url without protocol', () => {
	const result = testFilterTags('example.com');
	assertEquals(result.length, 0);
});

Deno.test('Remove Url with www', () => {
	const result = testFilterTags('www.example.com');
	assertEquals(result.length, 0);
});

Deno.test('Remove Url with weird tld', () => {
	const result = testFilterTags('http://my.blog');
	assertEquals(result.length, 0);
});

Deno.test('Remove Emoticon', () => {
	const result = testFilterTags(':-)');
	assertEquals(result.length, 0);
});

Deno.test('Remove AtMention', () => {
	const result = testFilterTags('@user');
	assertEquals(result.length, 0);
});

Deno.test('Remove Email', () => {
	const result = testFilterTags('email@example.com');
	assertEquals(result.length, 0);
});

Deno.test('Remove HashTag', () => {
	const result = testFilterTags('#hashtag');
	assertEquals(result.length, 0);
});

// Ngram tests
// -----------------------------------------------------------------------------

function getTestNgrams(text: string) {
	const metadata = preliminaries(text);
  const terms = extractDocument(metadata);
	const result = getNgrams(terms, 1, 3);
  return result;
}

Deno.test('Produces expected ngrams', () => {
	const expected = [
		'education',
		'education does',
		'education does not',
		'does',
		'does not',
		'does not never',
		'not',
		'not never',
		'not never end',
		'never',
		'never end',
		'never end watson',
		'end',
		'end watson',
		'watson',
	];

	const result = getTestNgrams('Education never ends, Watson.');
  assertEquals(result.length, expected.length);
});

Deno.test('Does not cross sentence boundaries', () => {
	const expected = [
		'education',
		'education does',
		'education does not',
		'does',
		'does not',
		'does not never',
		'not',
		'not never',
		'not never end',
		'never',
		'never end',
		'end',
		'watson',
	];

	const result = getTestNgrams('Education never ends. Watson.');
  assertEquals(result.length, expected.length);
});

Deno.test('Filters extraneous parts of speech', () => {
	const expected = [
    'henry',
    'henry bad',
    'henry bad golf',
    'bad',
    'bad golf',
    'golf'
  ];

	const result = getTestNgrams('Henry is bad at golf #blabla.');
  assertEquals(result.length, expected.length);
});
