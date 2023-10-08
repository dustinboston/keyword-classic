import { assertEquals } from 'https://deno.land/std@0.200.0/assert/mod.ts';
import { preliminaries } from '../src/keyword_classic.ts';

// For preset heavy [1]
// -----------------------------------------------------------------------------

Deno.test('Convert ASCII', () => {
	const view = preliminaries('brûnçh');
	assertEquals(view.text(), 'brunch');
});

Deno.test('Convert plural to singular', () => {
	const view = preliminaries('cats');
	assertEquals(view.text(), 'cat');
});

Deno.test('Convert verbs to infinitives', () => {
	const view = preliminaries('running');
	assertEquals(view.text(), 'run');
});

Deno.test('Convert upper to lower', () => {
	const view = preliminaries('LOUD');
	assertEquals(view.text(), 'loud');
});

Deno.test('Expand contractions', () => {
	const view = preliminaries(`there'd`);
	assertEquals(view.text(), 'there would');
});

Deno.test('Remove commas', () => {
	const view = preliminaries('remove, commas');
	assertEquals(view.text(), 'remove commas');
});

Deno.test('Remove semicolons', () => {
	const view = preliminaries('remove; semicolons');
	assertEquals(view.text(), 'remove semicolons');
});

Deno.test('Remove hyphens', () => {
	const view = preliminaries('remove-hyphen');
	assertEquals(view.text(), 'remove hyphen');
});

Deno.test('Remove newlines', () => {
	const view = preliminaries('remove\nnewline');
	assertEquals(view.text(), 'remove newline');
});

Deno.test('Remove periods from acronyms', () => {
	const view = preliminaries('U.S.A.');
	assertEquals(view.text(), 'usa');
});

Deno.test('Remove Emoji', () => {
	const view = preliminaries('🙂');
	assertEquals(view.text(), '');
});

Deno.test('Remove bullets', () => {
	const view = preliminaries('* bullet');
	assertEquals(view.text(), 'bullet');
});

Deno.test('Remove possessives', () => {
	const view = preliminaries('John\'s');
	assertEquals(view.text(), 'john');
});

Deno.test('Remove adverbs', () => {
	const view = preliminaries('quickly');
	assertEquals(view.text(), '');
});

Deno.test('Remove honorifics', () => {
	const view = preliminaries('Mr. John');
	assertEquals(view.text(), 'john');
});

Deno.test('Remove parentheses', () => {
	const view = preliminaries('hello (world)');
	assertEquals(view.text(), 'hello world');
});

/**
 * @todo Remove brackets
 */
Deno.test('Doesn\'t remove brackets', () => {
	const view = preliminaries('hello [world]');
	assertEquals(view.text(), 'hello [world]');
});

/**
 * @todo Remove braces
 */
Deno.test('Doesn\'t remove braces', () => {
	const view = preliminaries('hello {world}');
	assertEquals(view.text(), 'hello {world}');
});

Deno.test('Remove quotes', () => {
	const view = preliminaries('"hello"');
	assertEquals(view.text(), 'hello');
});

Deno.test('Remove extra spaces', () => {
	const view = preliminaries('hello  world');
	assertEquals(view.text(), 'hello world');
});

// Removed manually [2]
// -----------------------------------------------------------------------------

Deno.test('Remove NumericValue', () => {
	const view = preliminaries('123');
	assertEquals(view.text(), '');
});

Deno.test('Doesn\'t remove a spelled-out NumericValue', () => {
	const view = preliminaries('one');
	assertEquals(view.text(), 'one');
});

Deno.test('Remove Money', () => {
	const view = preliminaries('$100');
	assertEquals(view.text(), '');
});

Deno.test('Remove Fraction', () => {
	const view = preliminaries('1/2');
	assertEquals(view.text(), '');
});

Deno.test('Remove Percent', () => {
	const view = preliminaries('50%');
	assertEquals(view.text(), '');
});

Deno.test('Remove PhoneNumber', () => {
	const view = preliminaries('123-456-7890');
	assertEquals(view.text(), '');
});

Deno.test('Remove Date', () => {
	const view = preliminaries('2021-10-10');
	assertEquals(view.text(), '');
});

// Remove stopwords with POS [3]
// -----------------------------------------------------------------------------

Deno.test('Remove Determiner', () => {
	const view = preliminaries('the cat');
	assertEquals(view.text(), 'cat');
});

Deno.test('Remove Preposition', () => {
	const view = preliminaries('bad at golf');
	assertEquals(view.text(), 'bad golf');
});

Deno.test('Remove Conjunction', () => {
	const view = preliminaries('apple and orange');
	assertEquals(view.text(), 'apple orange');
});

Deno.test('Remove Pronoun', () => {
	const view = preliminaries('he she');
	assertEquals(view.text(), '');
});

Deno.test('Remove Copula', () => {
	const view = preliminaries('is are');
	assertEquals(view.text(), '');
});

// Remove web markup [4]
// NOTE: remove emoji is tested above
// -----------------------------------------------------------------------------

Deno.test('Remove Url', () => {
	const view = preliminaries('https://example.com');
	assertEquals(view.text(), '');
});

Deno.test('Remove unsecured Url', () => {
	const view = preliminaries('http://example.com');
	assertEquals(view.text(), '');
});

Deno.test('Remove Url without protocol', () => {
	const view = preliminaries('example.com');
	assertEquals(view.text(), '');
});

Deno.test('Remove Url with www', () => {
	const view = preliminaries('www.example.com');
	assertEquals(view.text(), '');
});

Deno.test('Remove Url with weird tld', () => {
	const view = preliminaries('http://my.blog');
	assertEquals(view.text(), '');
});

Deno.test('Remove Emoticon', () => {
	const view = preliminaries(':-)');
	assertEquals(view.text(), '');
});

Deno.test('Remove AtMention', () => {
	const view = preliminaries('@user');
	assertEquals(view.text(), '');
});

Deno.test('Remove Email', () => {
	const view = preliminaries('email@example.com');
	assertEquals(view.text(), '');
});

Deno.test('Remove HashTag', () => {
	const view = preliminaries('#hashtag');
	assertEquals(view.text(), '');
});
