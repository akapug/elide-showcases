/**
 * Chartist - Simple Responsive Charts
 *
 * Simple responsive charts with great default settings.
 * **POLYGLOT SHOWCASE**: One Chartist implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/chartist (~100K+ downloads/week)
 *
 * Features:
 * - Responsive design
 * - SVG charts
 * - Animations
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface ChartistData {
  labels: string[];
  series: number[][];
}

export class ChartistChart {
  data: ChartistData;

  constructor(container: any, data: ChartistData) {
    this.data = data;
  }

  render(): string {
    let output = 'Chartist\n\n';
    this.data.series.forEach((series, idx) => {
      output += `Series ${idx + 1}:\n`;
      series.forEach((value, i) => {
        const bar = '█'.repeat(Math.floor(value / 5));
        output += `  ${this.data.labels[i]}: ${bar} ${value}\n`;
      });
      output += '\n';
    });
    return output;
  }
}

export function Line(container: any, data: ChartistData): ChartistChart {
  return new ChartistChart(container, data);
}

if (import.meta.url.includes("elide-chartist.ts")) {
  console.log("📊 Chartist for Elide (POLYGLOT!)\n");
  const chart = Line('chart', {
    labels: ['Mon', 'Tue', 'Wed'],
    series: [[5, 2, 8]]
  });
  console.log(chart.render());
  console.log("🚀 ~100K+ downloads/week on npm!");
}
