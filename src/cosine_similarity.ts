/**
 * @file This file contains functions to calculate the cosine
 * similarity between two vectors, which is a measure of their
 * similarity as the cosine of the angle between them. It also provides
 * helper functions to compute the dot product and magnitude of vectors,
 * which are essential parts of the cosine similarity calculation.
 */

export function calculateCosineSimilarityMatrix(
  tfIdfMatrixA: number[][],
  tfIdfMatrixB?: number[][]
): number[][] {
  const similarityMatrix: number[][] = [];
  const matrixB = tfIdfMatrixB ?? tfIdfMatrixA;

  for (let i = 0; i < tfIdfMatrixA.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < matrixB.length; j++) {
      if (tfIdfMatrixB === undefined && i === j) {
        similarityMatrix[i][j] = 1; // If only one matrix, diagonal is 1
      } else {
        similarityMatrix[i][j] = calculateCosineSimilarity(
          tfIdfMatrixA[i],
          matrixB[j],
        );
      }
    }
  }

  return similarityMatrix;
}

/**
 * Calculates the cosine similarity between two vectors.
 * Cosine similarity is a measure of similarity between two non-zero vectors
 * of an inner product space that measures the cosine of the angle between them.
 *
 * @param vectorA - The first vector for comparison.
 * @param vectorB - The second vector for comparison.
 * @throws {Error} If vectors are not of the same length.
 * @returns The cosine similarity ranging from -1 to 1, where 1 means the
 * vectors are identical.
 */
export function calculateCosineSimilarity(
	vectorA: number[],
	vectorB: number[],
): number {
	if (vectorA.length !== vectorB.length) {
		throw new Error('Vectors must be the same length');
	}
	const dotProduct = calculateDotProduct(vectorA, vectorB);
	const magnitude = calculateMagnitude(vectorA) * calculateMagnitude(vectorB);
	if (magnitude === 0) return 0;

	const cosineSimilarity = dotProduct / magnitude;
	return cosineSimilarity;
}

/**
 * Calculates the dot product (also known as scalar product or inner product)
 * of two vectors. The dot product is the sum of the products of the
 * corresponding entries of the two sequences of numbers.
 *
 * @param vectorA - The first vector for the dot product calculation.
 * @param vectorB - The second vector for the dot product calculation.
 * @throws {Error} If vectors are not of the same length.
 * @returns The dot product of the two vectors.
 */
export function calculateDotProduct(vectorA: number[], vectorB: number[]) {
	if (vectorA.length !== vectorB.length) {
		throw new Error('Vectors must be the same length');
	}
	return vectorA.reduce<number>(
		(sum, weight, i) => sum + (weight * vectorB[i]),
		0,
	);
}

/**
 * Calculates the magnitude (or length) of a vector in n-dimensional space.
 * The magnitude is the square root of the sum of the squares of the vector's
 * components.
 *
 * @param vector - The vector to calculate the magnitude of.
 * @returns The magnitude of the vector.
 */
export function calculateMagnitude(vector: number[]) {
	return Math.sqrt(
		vector.reduce<number>((sum, weight) => sum + weight ** 2, 0),
	);
}
