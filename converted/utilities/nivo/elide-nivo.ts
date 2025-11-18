/**
 * Nivo - React Data Visualization
 *
 * Supercharged React components for data visualization.
 * **POLYGLOT SHOWCASE**: One Nivo implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@nivo/core (~300K+ downloads/week)
 *
 * Features:
 * - Rich chart library
 * - React components
 * - Responsive
 * - Themeable
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

export interface NivoData {
  id: string;
  value: number;
}

export class NivoBar {
  data: NivoData[];

  constructor(data: NivoData[]) {
    this.data = data;
  }

  render(): string {
    let output = 'Nivo Bar Chart\n\n';
    this.data.forEach(item => {
      const bar = '█'.repeat(Math.floor(item.value / 10));
      output += `${item.id}: ${bar} ${item.value}\n`;
    });
    return output;
  }
}

export function ResponsiveBar(props: { data: NivoData[] }): NivoBar {
  return new NivoBar(props.data);
}

if (import.meta.url.includes("elide-nivo.ts")) {
  console.log("📊 Nivo for Elide (POLYGLOT!)\n");
  const chart = ResponsiveBar({
    data: [
      { id: 'A', value: 100 },
      { id: 'B', value: 150 }
    ]
  });
  console.log(chart.render());
  console.log("🚀 ~300K+ downloads/week on npm!");
}
