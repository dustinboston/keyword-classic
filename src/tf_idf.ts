/**
 * @file This file implements the Term Frequency-Inverse Document
 * Frequency (TF-IDF) weighting scheme, a statistical measure used to evaluate
 * how important a word is to a document in a collection or corpus. It also
 * includes functions for calculating term frequency and inverse document
 * frequency which are the building blocks for computing TF-IDF scores.
 */

import { Corpus } from './types.d.ts';

/** A map of terms to their respective vector columns */
export type TermColumn = Map<string, number>;

/** An array of term frequencies mapped to term columns */
export type TfVector = number[];

/** An array of document frequencies mapped to term columns */
export type DfVector = number[];

/** An array of inverse document frequencies mapped to term columns */
export type IdfVector = number[];

/** An array of TF-IDF scores mapped to term columns */
export type TfIdfVector = number[];

/**
 * Create a TF-IDF matrix for an entire corpus.
 *
 * Calculates the term frequency-inverse document frequency (TF-IDF) for each
 * term in the documents of the given corpus. This helps in understanding the
 * importance or relevance of a term to a document in the context of a corpus.
 *
 * @param corpus The corpus of documents to calculate TF-IDF scores for.
 * @returns An array of maps where each map represents the TF-IDF scores of
 * terms in the corresponding document of the corpus.
 *
 * - Each row in the matrix represents a document from the corpus.
 * - Each column corresponds to a term (word or n-gram) from the entire corpus.
 * - Each cell at row i, col j contains the TF-IDF score of term j in doc i.
 */
export function computeTfIdfMatrix(corpus: Corpus): TfIdfVector[] {
	const terms: TermColumn = getTerms(corpus);
	const tfs = computeTF(corpus, terms);
	const dfs = computeDF(tfs, terms.size);
	const idfs = computeIDF(dfs, corpus.length);
	return computeTfIdf(
		tfs,
		idfs,
		corpus.length,
		terms.size,
	);
}

/**
 * The final step in computing a TF-IDF score is multiplying the TF and the 
 * IDF. If you want more control over the TF-IDF process, for example, to 
 * create your own custom tfVectors, use this function. Otherwise use the
 * computeTfIdfMatrix function.
 *
 * @see computeTfIdfMatrix
 * @param tfVectors A map of terms to term frequency in a document.
 * @param idfVector An array of IDF values, one per term.
 * @param documentCount the number of documents in the corpus.
 * @param termCount the number of unique terms in the corpus.
 * @returns a matrix of TF-IDF scores.
 */
export function computeTfIdf(
	tfVectors: TfVector[],
	idfVector: IdfVector,
	documentCount: number,
	termCount: number,
): TfIdfVector[] {
	// Initialize the tfIdfVectors
	const tfIdfs: TfIdfVector[] = Array.from(
		{ length: termCount },
		() => Array.from({ length: documentCount }, () => 0),
	);

	for (let i = 0; i < tfVectors.length; i++) {
		for (let j = 0; j < tfVectors[i].length; j++) {
			const tf = tfVectors[i][j];
			const idf = idfVector[i];
			tfIdfs[i][j] = tf * idf;
		}
	}
	return tfIdfs;
}


/**
 * Calculates the term frequency (TF) for each term in the document. TF is the
 * number of times a term appears in the document.
 *
 * @param document An array of terms representing the document to calculate
 * term frequencies for.
 * @returns A map of terms to their corresponding term frequency in the doc.
 */
export function computeTF(
	corpus: Corpus,
	terms: TermColumn,
): TfVector[] {
	return corpus.map((document) => {
		const tfVector: number[] = Array.from({ length: terms.size }, () => 0);
		document.forEach((term) => {
			const columnIndex = terms.get(term);
			if (columnIndex !== undefined) {
				tfVector[columnIndex] = (tfVector[columnIndex] ?? 0) + 1;
			}
		});
		return tfVector;
	});
}

/**
 * Calculates the inverse document frequency (IDF) for each term across all
 * documents. IDF measures the importance of a term; rarer terms have higher
 * IDF values.
 *
 * The +1 outside the logarithm function is a technique that ensures that
 * terms with a document frequency of 1 (which occur in only one document)
 * have an IDF of zero. This offset allows the TF-IDF to prioritize terms
 * that are unique to a document but still gives a small amount of weight to
 * terms that are more common.
 *
 * @param dfs A DF vector, see computeDF for details.
 * @param documentCount is the number of documents in the corpus.
 * @returns a vector of IDF values, one per term.
 */
export function computeIDF(dfs: DfVector, documentCount: number): IdfVector {
	const n = documentCount;
	const terms = dfs.length;
	return Array.from({ length: terms }, (_, i) => Math.log(n / dfs[i]) + 1);
}

/**
 * Computes the Document Frequency (DF) vector for a given set of terms and
 * their term frequency vectors. The DF for a term is the number of documents
 * in which the term appears.
 *
 * @param terms - A map or object where keys are terms and values are indices.
 * @param tfVectors - An array of TF vectors, each representing a document.
 * @returns - A vector where each element represents the DF of a term.
 */
export function computeDF(tfVectors: TfVector[], termCount: number): DfVector {
	// Initialize the DF vector with zeros
	const dfVector: DfVector = Array.from({ length: termCount }, () => 0);

	// Count how many documents each term appears in
	for (let t = 0; t < termCount; t++) {
		for (let f = 0; f < tfVectors[t].length; f++) {
			if (tfVectors[t][f] > 0) {
				dfVector[t] += 1;
			}
		}
	}

	return dfVector;
}

/**
 * Extracts a set of unique terms from a corpus of documents and maps each 
 * term to a unique index. This function creates a mapping that can be used to 
 * convert terms into vector indices for further text analysis operations 
 * such as TF-IDF.
 *
 * @param corpus - An array of documents; each document is an array of strings.
 * @returns A Map where keys are terms and values are unique indices.
 */
export function getTerms(corpus: Corpus) {
	return corpus.reduce<TermColumn>((termColumn, document) => {
		document.forEach((term) => {
			if (!termColumn.has(term)) {
				termColumn.set(term, termColumn.size);
			}
		});
		return termColumn;
	}, new Map());
}

/**
 * Transposes a two-dimensional array (matrix), converting rows to columns and
 * vice versa. This function is useful in scenarios where you need to change 
 * the orientation of data in a matrix. For instance, in text analysis, 
 * converting a term-document matrix to a document-term matrix can facilitate 
 * certain types of calculations such as computing cosine similarity between 
 * documents.
 *
 * How it works:
 * - The function iterates over the first row of the input matrix to determine 
 *   the number of columns.
 * - For each column index, it constructs a new row by gathering the elements 
 *   from each original row at that column index.
 * - The map function on the first row creates a new array where each element 
 *   is the result of the inner map, which assembles a new row for the 
 *   transposed matrix.
 *
 * @param matrix - The matrix to be transposed, represented as an array of arrays.
 * @returns The transposed matrix.
 */
export function transpose(matrix: number[][]): number[][] {
	return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}
