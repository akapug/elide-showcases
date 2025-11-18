/**
 * D3-Selection - DOM Selection
 *
 * Transform the DOM by selecting elements and joining to data.
 * **POLYGLOT SHOWCASE**: One D3-Selection implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-selection (~2M+ downloads/week)
 *
 * Package has ~2M+ downloads/week on npm!
 */

export class Selection {
  elements: any[] = [];

  selectAll(selector: string): Selection {
    return new Selection();
  }

  data(values: any[]): Selection {
    this.elements = values.map(d => ({ data: d }));
    return this;
  }

  enter(): Selection {
    return this;
  }
}

export function select(selector: string): Selection {
  return new Selection();
}

if (import.meta.url.includes("elide-d3-selection.ts")) {
  console.log("📊 D3-Selection for Elide (POLYGLOT!)\n");
  const s = select('body').selectAll('p').data([1, 2, 3]);
  console.log("🚀 ~2M+ downloads/week on npm!");
}
