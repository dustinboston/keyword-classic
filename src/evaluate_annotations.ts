/**
 * Compare keywords and phrases from different annotators to find similarities.
 */

import { Document } from './deps.ts';
import {
	extractDocument,
	keywordClassic,
	parseArguments,
	preliminaries,
} from './keyword_classic.ts';
import {
	Config,
	Corpus,
	FileAttrs,
	ParsedFrontMatter,
	SimilarityScore,
} from './types.d.ts';
import {
	computeDF,
	computeIDF,
	computeTF,
	computeTfIdf,
	getTerms,
	TermColumn,
	transpose,
} from './tf_idf.ts';
import { editDistance } from './edit_distance.ts';
import { calculateIntersectionWeight } from './intersection.ts';
import { Vert } from './vert.ts';
import { calculateCosineSimilarityMatrix } from './cosine_similarity.ts';

const MAX_SIMILARITY_THRESHOLD = 0.999;
const MIN_SIMILARITY_THRESHOLD = 0.0; // .2
const EDIT_SIMILARITY_THRESHOLD = 0.0; // .1
const KEYWORD_MATCH_SCORE_VALUE = .2;

export function evaluateResults(
	data: ParsedFrontMatter<FileAttrs>,
) {
	const results = keywordClassic(data);
	const keywords = normalizeKeywords(data.attrs.keywords);
	// const scores = evaluateKeywords(results, keywords);
	// console.log('scores', scores);
}

export function normalizeKeywords(
	keywords: string[] = [],
	config: Config = {},
): Document {
	const text = keywords.join('\n');
	const metadata = preliminaries(text);
	const document = extractDocument(metadata, config);
	return document;
}

export function evaluateKeywords(results: Vert[], keywords: Document = []) {
	const corpus: Corpus = [
		...results.map((v) => v.val.split(' ')),
		...keywords.map((t) => t.map((u) => u.normal)),
	];

	const unique = getTerms(corpus);
	const uniqueResults = getTerms([results.map((v) => v.val)]);
	const uniqueKeywords = getTerms([
		keywords.map((t) => t.map((u) => u.normal).join(' ')),
	]);

	const tfIdfs = extractTfIdf(corpus, unique, corpus.length, unique.size);
	const similarityMatrix = calculateCosineSimilarityMatrix(tfIdfs);

	const scores = getInitialScores(similarityMatrix, corpus);
	const matchScores = filterSameSource(
		scores,
		uniqueResults,
		uniqueKeywords,
	);
	const editScores = applyEditDistance(matchScores);
	const deduped = filterDuplicates(editScores);
	deduped.forEach((s) => {
		console.log(`${s.score},${s.aTerm},${s.bTerm}`);
	});

	// console.log(JSON.stringify(editScores, null, 4));
	// console.log(JSON.stringify(Array.from(uniqueKeywords), null, 4));
	// console.log(JSON.stringify(Array.from(uniqueResults), null, 4));
	// const scores = applyIntersection(editScores);
	//
	// return scores;
	// console.log(similarityMatrix);
}

export function filterDuplicates(scores: SimilarityScore[]) {
	const sorted = scores.toSorted((a, b) => b.score - a.score);
	return sorted.reduce<SimilarityScore[]>((unique, score, i, arr) => {
		if (i > 0) {
			const last = arr[i - 1];
			if (
				!(score.score === last.score &&
					score.aTerm === last.aTerm &&
					score.bTerm === last.bTerm)
			) unique.push(score);
		}
		return unique;
	}, []);
}

export function filterSameSource(
	editScores: SimilarityScore[],
	results: TermColumn,
	keywords: TermColumn,
) {
	return editScores.reduce<SimilarityScore[]>((scores, s) => {
		if (
			results.has(s.aTerm) && keywords.has(s.bTerm) ||
			results.has(s.bTerm) && keywords.has(s.aTerm)
		) {
			const matchScore = s.score + KEYWORD_MATCH_SCORE_VALUE;
			s.scoreHistory.push(
				['current', s.score],
				['keywordMatch', matchScore],
			);
			s.score = matchScore;
			scores.push(s);
		}
		return scores;
	}, []);
}

export function extractTfIdf(
	corpus: string[][],
	uniqueTerms: TermColumn,
	docCount: number,
	termCount: number,
): number[][] {
	const tfs = computeTF(corpus, uniqueTerms);
	const tfsTermsByDocs = transpose(tfs);
	const dfs = computeDF(tfsTermsByDocs, uniqueTerms.size);
	const idfs = computeIDF(dfs, docCount);
	const tfIdfs = computeTfIdf(tfsTermsByDocs, idfs, docCount, termCount);
	const tfIdfsTermsByDocs = transpose(tfIdfs);
	return tfIdfsTermsByDocs;
}

export function getInitialScores(
	similarityMatrix: number[][],
	corpus: Corpus,
): SimilarityScore[] {
	const scores: SimilarityScore[] = [];
	for (let aIndex = 0; aIndex < corpus.length; aIndex++) {
		// let topScore = -Infinity;
		// let topAIndex = -Infinity;
		// let topBIndex = -Infinity;

		for (let bIndex = aIndex + 1; bIndex < corpus.length; bIndex++) {
			const score = similarityMatrix[aIndex][bIndex];
			// if (
			// 	score > topScore &&
			// 	score < MAX_SIMILARITY_THRESHOLD &&
			// 	score > MIN_SIMILARITY_THRESHOLD
			// ) {
			// 	topScore = score;
			// 	topAIndex = aIndex;
			// 	topBIndex = bIndex;
			// }
			if (
				score > MIN_SIMILARITY_THRESHOLD &&
				score < MAX_SIMILARITY_THRESHOLD
			) {
				scores.push({
					score: score,
					aIndex,
					bIndex,
					aTerm: corpus[aIndex].join(' '),
					bTerm: corpus[bIndex].join(' '),
					scoreHistory: [['initialScore', score]],
				});
			}
		}
		// if (
		// 	topScore > -Infinity && topAIndex > -Infinity &&
		// 	topBIndex > -Infinity
		// ) {
		// 	scores.push({
		// 		score: topScore,
		// 		aIndex: topAIndex,
		// 		bIndex: topBIndex,
		// 		aTerm: corpus[topAIndex].join(' '),
		// 		bTerm: corpus[topBIndex].join(' '),
		// 		scoreHistory: [],
		// 	});
		// }
	}
	return scores;
}

export function applyEditDistance(topScores: SimilarityScore[]) {
	// for (const score of topScores) {
	return topScores.reduce<SimilarityScore[]>((scores, score) => {
		const distance = editDistance(score.aTerm, score.bTerm);
		const sumTermLengths = score.aTerm.length + score.bTerm.length;
		const normDistance = distance / sumTermLengths;
		const editSimilarity = score.score - normDistance;
		if (editSimilarity > 0 && editSimilarity > EDIT_SIMILARITY_THRESHOLD) {
			score.scoreHistory.push(
				['current', score.score],
				['editDistance', distance],
				['editScore', editSimilarity],
			);
			score.score = editSimilarity;
			scores.push(score);
		}
		return scores;
	}, []);
	// }
}

export function applyIntersection(scores: SimilarityScore[]) {
	for (const score of scores) {
		const intersectionWeight = calculateIntersectionWeight(
			score.aTerm.split(' '),
			score.bTerm.split(' '),
		);
		score.scoreHistory.push(
			['current', score.score],
			['intersectionWeight', intersectionWeight],
		);
		score.score = intersectionWeight;
	}
}

/**
 * Compare the results from Keyword Classic to the expected keywords.
 * evaluate_results uses the same interface as keyword_classic.
 */
async function main() {
	const { data } = await parseArguments();
	evaluateResults(data);
}

if (import.meta.main) {
	main();
}
