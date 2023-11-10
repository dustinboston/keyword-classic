import { Scores, Term } from './types.d.ts';

export class Vert {
	constructor(
		public id: number,
		public val: string,
		public inbound: Vert[] = [],
		public outbound: Vert[] = [],
		public score = 1,
		public ngram: Term[] = [],
    public weights: Scores = []
	) {}
}
