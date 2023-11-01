/**
 * Keyword Classic
 * Extract keywords from a document using some classic NLP methods:
 * - Textrank: Weighted Textrank over NGrams.
 * - NGrams: Basic frequency-based NGrams.
 * - TF-IDF: Each sentence is considered a document.
 * @file
 */

import { compromise, flags, stats, StatsMethods } from './deps.ts';
import { File, FileAttrs, Print, Scores, View } from './types.d.ts';
import { parseText, parseYaml, readFile } from './file_system.ts';
import { TextrankMethods, TextrankTerm } from './plugin/types.d.ts';
import textrank from './plugin/textrank_plugin.ts';

compromise.plugin(stats);
compromise.plugin(textrank);


// TODO: Implement weights
export function keywordClassic(file: File, weights?: Scores) {
  const doc = preliminaries(file.body);

  const sentences = doc.json() as TextrankTerm[];
  const ngrams = extractNgrams(sentences);

  // const tfidf = extractTfIdf(doc);
  const textrank = extractTextrank(doc);
  return textrank;
}

export function preliminaries(text: string): View {
  const doc = compromise<StatsMethods & TextrankMethods>(text);
  doc.normalize('heavy');

  // doc.remove('#NumericValue')
  //   .remove('#Money')
  //   .remove('#Fraction')
  //   .remove('#Percent')
  //   .remove('#PhoneNumber')
  //   .remove('#Date');
  //
  // // Stopwords
  // doc.remove('#Determiner')
  //   .remove('#Preposition')
  //   .remove('#Conjunction')
  //   .remove('#Pronoun')
  //   .remove('#Copula')
  //   .remove('&');
  //
  // doc.remove('#Url')
  //   .remove('#Emoji')
  //   .remove('#Emoticon')
  //   .remove('#AtMention')
  //   .remove('#Email')
  //   .remove('#HashTag');

  return doc;
}

export function extractNgrams(sentences: TextrankTerm[]) {

}

export function extractTfIdf(doc: View): Scores {
  const tfidf: Scores = doc.tfidf();
  return tfidf;
}

/**
 * Get the text rank for ngrams in the document.
 * @param doc The document to extract textrank ngrams from.
 * @returns Ngrams scored by textrank
 */
export function extractTextrank(doc: View): Scores {
  const textrank: Scores = Array.from(doc.textrankNgrams());
  return textrank;
}

export function pruneSimilar(results: Scores) {
  for (let i = 0; i < results.length; i++) {
    for (let j = 0; j < results.length; j++) {
      if (i === j) continue;
    }
  }
}

function topkResults(feature: Scores, percent = 10): Scores {
  const decimal = percent * .01;
  const count = Math.round(feature.length * decimal);
  return feature.slice(0, count);
}

function showHelp(errorMessage = '') {
  const help = `Usage: keyword_classic [OPTION]... FILE

Extract keywords from a FILE using classic NLP algorithms.
FILE can be any text-based file. YAML front-matter is supported.
Front-matter will be returned with the results.

-a, --algo NAME		Which algorithm to use for extracting keywords. 
NAME can be 'textrank' (default) or 'tfidf'.
-t, --topk NUM		Limit the results to the top K percent of results.
Defaults to 10 (%). Use 100 to show all results.
-w, --weight FILE	A YAML file with an array of "- [word, weight]" tuples 
where weight is a multiplier applied to matches.
-h, --help			Show this message.
  `;

  if (errorMessage) console.error(errorMessage);
  console.log(help);
}

async function main() {
  const cli = flags.parse(Deno.args, {
    boolean: ['help'],
    string: ['topk', 'weight'],
    alias: { help: 'h', topk: 't', weight: 'w' },
    default: { weight: '', topk: 100 },
  });

  const [file] = cli._;
  if (!file || typeof file !== 'string') {
    showHelp('A file is required.');
    Deno.exit(1);
  }

  if (cli.help) {
    showHelp();
    Deno.exit(0);
  }

  const weightFile = cli.weight;
  let weights: Scores = [];
  if (cli.weight) {
    const [, yaml] = await readFile(weightFile);
    weights = parseYaml<Scores>(yaml);
  }

  const [, text] = await readFile(file);
  const json = parseText<FileAttrs>(text);
  const results = keywordClassic(json, weights);

  const print: Print = {
    attrs: json.attrs ?? {},
    scores: topkResults(results, +cli.topk),
  };

  console.log(JSON.stringify(print, null, '    '));
}

if (import.meta.main) {
  main();
}
