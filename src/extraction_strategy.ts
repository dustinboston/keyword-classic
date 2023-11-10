import { GraphData, Ngram } from './types.d.ts';

export abstract class ExtractionStrategy {
	constructor() {}
	abstract transform(ngram: Ngram): string;
	abstract collect(graphData: GraphData): void;
}
