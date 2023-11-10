import {
	calculateCosineSimilarity,
	calculateDotProduct,
	calculateMagnitude,
} from '../src/cosine_similarity.ts';
import { assert, assertEquals, assertThrows, assertAlmostEquals } from './deps.ts';

Deno.test('calculateCosineSimilarity should handle zero magnitude vectors', () => {
	const vectorA = [0, 0, 0];
	const vectorB = [0, 0, 0];
	try {
		calculateCosineSimilarity(vectorA, vectorB);
	} catch (error) {
		assert(error instanceof Error);
		assertEquals(
			error.message,
			'Cannot calculate cosine similarity for zero magnitude vectors',
		);
	}
});

Deno.test('calculateDotProduct should calculate correct dot product', () => {
	const vectorA = [1, 2, 3];
	const vectorB = [4, 5, 6];
	const expectedDotProduct = 32; // 1*4 + 2*5 + 3*6
	assertEquals(calculateDotProduct(vectorA, vectorB), expectedDotProduct);
});

Deno.test('calculateMagnitude should calculate correct magnitude', () => {
	const vector = [1, 2, 3];
	const expectedMagnitude = Math.sqrt(1 + 4 + 9); // sqrt(1^2 + 2^2 + 3^2)
	assertEquals(calculateMagnitude(vector), expectedMagnitude);
});

Deno.test('calculateCosineSimilarity should calculate correct cosine similarity', () => {
	const vectorA = [1, 0, 0];
	const vectorB = [1, 0, 0];
	const expectedSimilarity = 1;
	assertEquals(
		calculateCosineSimilarity(vectorA, vectorB),
		expectedSimilarity,
	);
});

Deno.test('calculateCosineSimilarity should throw for vectors of different lengths', () => {
	const vectorA = [1, 2];
	const vectorB = [1, 2, 3];
	assertThrows(
		() => calculateCosineSimilarity(vectorA, vectorB),
		Error,
		'Vectors must be the same length',
	);
});

Deno.test('calculateCosineSimilarity should handle orthogonal vectors', () => {
	const vectorA = [1, 0];
	const vectorB = [0, 1];
	const expectedSimilarity = 0;
	assertEquals(
		calculateCosineSimilarity(vectorA, vectorB),
		expectedSimilarity,
	);
});

Deno.test('calculateCosineSimilarity should handle zero magnitude vectors', () => {
	const vectorA = [0, 0, 0];
	const vectorB = [0, 0, 0];
	const expectedSimilarity = 0;
	assertEquals(
		calculateCosineSimilarity(vectorA, vectorB),
		expectedSimilarity,
	);
});

Deno.test('calculateCosineSimilarity should handle negative values', () => {
	const vectorA = [-1, -2, -3];
	const vectorB = [-1, -2, -3];
	const expectedSimilarity = 1;
	assertEquals(
		calculateCosineSimilarity(vectorA, vectorB),
		expectedSimilarity,
	);
});

Deno.test("calculateCosineSimilarity should handle large values", () => {
  const largeNumber = Number.MAX_SAFE_INTEGER;
  const vectorA = [largeNumber, largeNumber];
  const vectorB = [largeNumber, largeNumber];
  const expectedSimilarity = 1;
  assertEquals(calculateCosineSimilarity(vectorA, vectorB), expectedSimilarity);
});

Deno.test("calculateCosineSimilarity should handle precision issues", () => {
  const vectorA = [0.1, 0.2];
  const vectorB = [0.1, 0.2];
  // Depending on the precision of the calculations, this might not be exactly 1
  const expectedSimilarity = 1;
  const similarity = calculateCosineSimilarity(vectorA, vectorB);
  // Allowing some margin for floating-point comparison
  assert(Math.abs(similarity - expectedSimilarity) < Number.EPSILON);
});

// Binary vectors
// ----------------------------------------------------------------------------

Deno.test('Two identical binary vectors should have a cosine similarity of 1', () => {
  const vectorA1 = [1, 0, 1, 1];
  const vectorB1 = [1, 0, 1, 1];
  // There will be some floating point precision issue here
  assertAlmostEquals(calculateCosineSimilarity(vectorA1, vectorB1), 1);
});

Deno.test('Two orthogonal vectors should have a cosine similarity of 0', () => {
  const vectorA2 = [1, 0, 1, 0];
  const vectorB2 = [0, 1, 0, 1];
  assertEquals(calculateCosineSimilarity(vectorA2, vectorB2), 0);

});

Deno.test('Two vectors with some similarity should have a cosine similarity between 0 and 1', () => {
  const vectorA3 = [1, 1, 0, 0];
  const vectorB3 = [0, 1, 1, 0];
  assertEquals(calculateCosineSimilarity(vectorA3, vectorB3) > 0, true);
  assertEquals(calculateCosineSimilarity(vectorA3, vectorB3) < 1, true);
});
