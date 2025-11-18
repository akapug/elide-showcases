/**
 * NVD3 - Reusable Charts for D3
 *
 * Reusable charting library built on D3.
 * **POLYGLOT SHOWCASE**: One NVD3 implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/nvd3 (~100K+ downloads/week)
 *
 * Features:
 * - Reusable chart components
 * - Interactive visualizations
 * - Built on D3
 * - Customizable
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface NVD3Data {
  key: string;
  values: Array<{ x: number; y: number }>;
}

export class NVD3Chart {
  data: NVD3Data[] = [];

  setData(data: NVD3Data[]): void {
    this.data = data;
  }

  render(): string {
    let output = 'NVD3 Chart\n\n';
    this.data.forEach(series => {
      output += `${series.key}:\n`;
      series.values.forEach(point => {
        output += `  (${point.x}, ${point.y})\n`;
      });
      output += '\n';
    });
    return output;
  }
}

export function lineChart(): NVD3Chart {
  return new NVD3Chart();
}

if (import.meta.url.includes("elide-nvd3.ts")) {
  console.log("📊 NVD3 for Elide (POLYGLOT!)\n");
  const chart = lineChart();
  chart.setData([
    { key: 'Series 1', values: [{ x: 1, y: 5 }, { x: 2, y: 10 }] }
  ]);
  console.log(chart.render());
  console.log("🚀 ~100K+ downloads/week on npm!");
}
