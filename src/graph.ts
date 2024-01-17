export enum Color {
  White = 0,
  Gray = 1,
  Black = 2
}

export class Vert {
	constructor(
		public val: string,
		public outbound: Vert[] = [],
    public parent: Vert | null = null,
    public distance: number = Infinity,
    public color: Color = Color.White 
	) {}
}

// Breadth-first search
export function bfs(g: Vert[], search: Vert) {
  g.forEach(u => {
    u.color = Color.White;
    u.distance = Infinity;
    u.parent = null;
  });

  search.color = Color.Gray;
  search.distance = 0;
  search.parent = null;

  const queue = [search];

  while (queue.length) {
    const u: Vert = queue.shift()!;
    for (let i = 0; i < u.outbound.length; i++) {
      const v = u.outbound[i];
      if (v.color === Color.White) {
        v.color = Color.Gray;
        v.distance = u.distance + 1;
        v.parent = u;
        queue.push(v);
      }
    }
    u.color = Color.Black;
  }
}

export function printPath(G: Vert[], search: Vert, vert: Vert) {
  if (vert === search) {
    console.log(search.val);
  } else if (vert.parent === null) {
    console.log(`no path from ${search.val} to ${vert.val} exists`);
  } else {
    printPath(G, search, vert.parent);
    console.log(vert.val);
  }
}

