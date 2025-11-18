/**
 * Vis-Data - Data Manipulation
 *
 * Manage unstructured data using DataSet.
 * **POLYGLOT SHOWCASE**: One Vis-Data implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/vis-data (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class DataSet {
  private data: any[] = [];

  constructor(data?: any[]) {
    this.data = data || [];
  }

  add(item: any): void {
    this.data.push(item);
  }

  get(id?: any): any {
    if (id === undefined) return this.data;
    return this.data.find(item => item.id === id);
  }

  update(item: any): void {
    const index = this.data.findIndex(d => d.id === item.id);
    if (index >= 0) this.data[index] = item;
  }

  remove(id: any): void {
    this.data = this.data.filter(item => item.id !== id);
  }
}

if (import.meta.url.includes("elide-vis-data.ts")) {
  console.log("📊 Vis-Data for Elide (POLYGLOT!)\n");
  const ds = new DataSet([{ id: 1, label: 'A' }]);
  ds.add({ id: 2, label: 'B' });
  console.log("Items:", ds.get());
  console.log("🚀 ~100K+ downloads/week on npm!");
}
