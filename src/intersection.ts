export function calculateIntersectionWeight(
	aTerms: string[],
	bTerms: string[],
) {
	const aSet = new Set(aTerms);
	const bSet = new Set(bTerms);
	const intersection = new Set([...aSet].filter((x) => bSet.has(x)));

	// Calculate weight based on the size of the intersection
	return intersection.size / Math.min(aTerms.length, bTerms.length);
}
