/**
 * @see Wagner, Robert A. and Fischer, Michael J. "The String-to-String Correction Problem". J. ACM* 21.1 (1974): 168–173.
 * @param a - start word
 * @param b - target word
 * @returns a matrix of edit operations where d[a.length - 1][b.length - 1] is the result.
 */
export function editDistance(a: string, b: string) {
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
  console.table(d);
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

