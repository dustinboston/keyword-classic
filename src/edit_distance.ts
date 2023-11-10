import { TermSet, AggregateScores, DistanceScore } from './types.d.ts';

/**
 * The matrix of edit operations could be returned instead of the result
 * at d[a.length - 1][b.length - 1] if a trace is needed. 
 *
 * @see Wagner, Robert A. and Fischer, Michael J. "The String-to-String Correction Problem". J. ACM* 21.1 (1974): 168–173.
 * @param a - start word
 * @param b - target word
 * @returns edit length
 */
export function editDistance(a: string, b: string): number {
  const d: number[][] = [[0]]; // distance
  for (let i = 1; i <= a.length; i++) d[i] = [d[i - 1][0] + cost(a[i - 1], null)];
  for (let j = 1; j <= b.length; j++) d[0][j] = d[0][j - 1] + cost(null, b[j - 1]);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const m1 = d[i - 1][j - 1] + cost(a[i - 1], b[j - 1]);
      const m2 = d[i - 1][j] + cost(a[i - 1], null);
      const m3 = d[i][j - 1] + cost(null, b[j - 1]);
      d[i][j] = Math.min(m1, m2, m3);
    }
  }
  return d[a.length - 1][b.length - 1];
}

/**
 * Determine the cost of an edit operation
 * @param a The value of a[i]
 * @param b The index of b[j]
 */
export function cost(a: string | null = null, b: string | null = null): number {
  if (a === b) return 0;
  if (a !== null && b !== null) return 1; // change
  if (a === null && b !== null) return 1; // insert
  if (a !== null && b === null) return 1; // delete
  throw new Error(`cost is broken a: ${a}, b: ${b}`);
};

// Aggregate scoring for evaluation. Not part of the algo.
// -------------------------------------------------------

/**
 * Aggregate the edit distance for every term in every set.
 */
export function aggregateEditDistances(termSets: TermSet[]): AggregateScores {
	const aggregateScores = new Map<string, DistanceScore[]>();
	for (let i = 0; i < termSets.length; i++) {
		for (let j = i + 1; j < termSets.length; j++) {
			const distanceScores = evaluateEditDistance(termSets, i, j);
			for (const distanceScore of distanceScores) {
				const { aCoord } = distanceScore;
				const value = aggregateScores.get(aCoord) ?? [];
				value.push(distanceScore);
				aggregateScores.set(aCoord, value);
			}
		}
	}
	return sortAggregateDistances(aggregateScores);
}

export function evaluateEditDistance(
	termSets: TermSet[],
	aIndex: number,
	bIndex: number,
): DistanceScore[] {
	const a = termSets[aIndex];
	const b = termSets[bIndex];
	const scores: DistanceScore[] = [];
	for (let i = 0; i < a.termLists.length; i++) {
		const aTerm = a.termLists[i].map((t) => t.text).join(' ');
		for (let j = 0; j < b.termLists.length; j++) {
			const bTerm = b.termLists[j].map((t) => t.text).join(' ');
			const distance = editDistance(aTerm, bTerm);
			const sumTerms = aTerm.length + bTerm.length;
			const score = sumTerms > 0 ? (distance / sumTerms) : 0;
			scores.push({
				aCoord: [aIndex, i].join(','),
				aTerm,
				bCoord: [bIndex, j].join(','),
				bTerm,
				distance,
				score,
			});
		}
	}
	return scores;
}

/**
 * Sort each bucket of aggregate scores in-place
 */
export function sortAggregateDistances(
	aggregate: AggregateScores,
): AggregateScores {
	aggregate.forEach((value) => value.sort((a, b) => a.score - b.score));
	return aggregate;
}
