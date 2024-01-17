/**
 * Keyword Classic
 * Extract keywords from a document using some classic NLP algorithms:
 *
 * - Textrank
 * - Cosine Similarity
 * - Edit Distance
 * - TF-IDF
 */

import { compromise, Document, flags } from "./deps.ts";
import { DocumentMetadata, Scores } from "./types.d.ts";
import { readFile } from "./file_system.ts";
import { getNgrams } from "./ngrams.ts";
import { NgramExtractionStrategy } from "./ngram_extraction_strategy.ts";
import { KeywordExtractionStrategy } from "./keword_extraction_strategy.ts";
import { Textrank } from "./textrank.ts";
import { Vert } from "./vert.ts";
import { IGNORE_LIST, STOP_WORDS } from "./constants.ts";

export function keywordClassic(text: string, extractNgrams = false) {
  const metadata = preliminaries(text);
  const document = extractDocument(metadata);

  const ngrams = extractNgrams
    ? extractNgramTextrank(document, metadata)
    : extractKeywordsTextrank(document, metadata);

  const sortedNgrams = ngrams.toSorted((a, b) => b.score - a.score);
  const scoredNgrams = getScores(sortedNgrams);
  return scoredNgrams;
}

export function preliminaries(text: string): DocumentMetadata[] {
  // Remove front-matter and markdown
  const preFilterText = text
    .toLowerCase()
    // Remove frontmatter
    .replace(/(---[\s\S]+?---)|(^\+\+\+[\s\S]+?\+\+\+$)/gm, "")
    // Remove Markdown
    .replace(/\[.*?\]\(.*?\)|[*_`#>]|!\[.*?\]\(.*?\)/g, "")
    // Split slashed words, e.g. this/that
    .replace(/(?<=\w)\/(?=\w)/g, " ");

  const doc = compromise(preFilterText);
  doc.compute("root");
  doc.normalize("heavy");
  return doc.json();
}

/**
 * Extracts terms from document metadata.
 * @param metadata The metadata to convert into filtered ngrams.
 * @return lists of ngrams.
 */
export function extractDocument(metadata: DocumentMetadata[]): Document {
  const document: Document = metadata.map((m) =>
    m.terms.filter((term) => {
      if (term.root && STOP_WORDS.has(term.root)) {
        return false;
      }

      if (STOP_WORDS.has(term.normal)) {
        return false;
      }

      if (!term.tags) {
        return true;
      }

      if (Array.from(term.tags).some((tag) => IGNORE_LIST.has(tag))) {
        return false;
      }

      return true;
    }),
  );

  return document;
}

export function extractNgramTextrank(
  document: Document,
  metadata: DocumentMetadata[],
): Vert[] {
  const ngrams = getNgrams(document, 2, 5);
  const textrank = new Textrank(new NgramExtractionStrategy());
  const rankedNgrams = textrank.extractData(ngrams);
  const completeTerms = recontextualizeTerms(rankedNgrams, metadata);
  return completeTerms;
}

export function extractKeywordsTextrank(
  document: Document,
  _metadata: DocumentMetadata[],
): Vert[] {
  const words = document.flatMap((t) => t).map((u) => [u]);
  const textrank = new Textrank(new KeywordExtractionStrategy(2));
  const ranked = textrank.extractData(words);
  return ranked;
}

/**
 * Rebuild the original sentence for each result and replace the `val` field
 * of each vertex with the result.
 * @param vert An array of vertices from the textrank algorithm.
 * @param metadata The original metadata before processing.
 * @returns an array of vertices
 */
export function recontextualizeTerms(
  vert: Vert[],
  metadata: DocumentMetadata[],
) {
  return vert.map((v) => {
    if (v.ngram.length === 0) throw new Error("Invalid empty ngram");
    if (v.ngram.length === 1) return { ...v, val: v.ngram[0].text };
    if (v.ngram.length > 1) {
      const [line, start] = v.ngram[0].index ?? [];
      const [, end] = v.ngram[v.ngram.length - 1].index ?? [];

      if (line !== void 0 && start !== void 0 && end !== void 0) {
        const sentence = metadata[line].terms;
        const terms = sentence.slice(start, end + 1);
        const val = terms.map((t) => t.text).join(" ");
        return { ...v, val };
      }
    }
    return v;
  });
}

/**
 * Dedupe a presorted list of vertices and return an array of scores.
 * @params vertices A sorted array of scored vertices
 * @returns An array of terms and scores
 */
export function getScores(vertices: Vert[]): Scores {
  const scores = vertices.reduce<Map<string, number>>((map, vert) => {
    if (!map.has(vert.val)) map.set(vert.val, vert.score);
    return map;
  }, new Map());
  return Array.from(scores);
}

export async function parseArguments() {
  const cli = flags.parseArgs(Deno.args);
  const [file] = cli._;
  if (!file || typeof file !== "string") {
    console.log("A file is required.");
    Deno.exit(1);
  }

  const [, text] = await readFile(file);
  return text;
}

export async function main() {
  const text = await parseArguments();
  const results = keywordClassic(text);
  console.log(JSON.stringify(results, null, 4));
}

if (import.meta.main) {
  main();
}
