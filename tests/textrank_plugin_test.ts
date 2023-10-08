import { assertEquals } from 'https://deno.land/std@0.200.0/assert/mod.ts';
import compromise from 'https://esm.sh/compromise@14.10.0';
import textrankPlugin, {
	textrank,
	TextrankMethods,
} from '../src/textrank_plugin.ts';

compromise.plugin(textrankPlugin);

Deno.test('Direct textrank usage', () => {
	const tokens = 'around and around and around'.split(' ');
	const result = textrank(tokens);
	assertEquals(result.length, 2);
	assertEquals(result[0].val, 'around');
	assertEquals(result[1].val, 'and');
});

Deno.test('Plugin textrank() usage', () => {
	const text = 'What goes around, comes around.';
	const doc = compromise<TextrankMethods>(text);
	const result = Array.from(doc.textrank());
	assertEquals(result.length, 4);
	assertEquals(result[0][0], 'around');
});

Deno.test('Plugin textrankNgrams() usage', () => {
	const text = 'What goes around, comes around.';
	const doc = compromise<TextrankMethods>(text);
	const result = Array.from(doc.textrankNgrams());
	assertEquals(result[0][0], 'around');
});
