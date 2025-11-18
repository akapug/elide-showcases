/**
 * interval-tree - Interval Tree Data Structure
 * Based on https://www.npmjs.com/package/interval-tree (~3M downloads/week)
 */

interface Interval {
  low: number;
  high: number;
  data?: any;
}

class IntervalTree {
  private intervals: Interval[];

  constructor() {
    this.intervals = [];
  }

  insert(low: number, high: number, data?: any): void {
    this.intervals.push({ low, high, data });
  }

  search(point: number): Interval[] {
    return this.intervals.filter(interval => point >= interval.low && point <= interval.high);
  }

  searchInterval(low: number, high: number): Interval[] {
    return this.intervals.filter(interval => {
      return !(interval.high < low || interval.low > high);
    });
  }

  remove(low: number, high: number): boolean {
    const index = this.intervals.findIndex(i => i.low === low && i.high === high);
    if (index !== -1) {
      this.intervals.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.intervals = [];
  }

  size(): number {
    return this.intervals.length;
  }

  toArray(): Interval[] {
    return [...this.intervals];
  }
}

export default IntervalTree;

if (import.meta.url.includes("elide-interval-tree.ts")) {
  console.log("✅ interval-tree - Interval Tree Data Structure (POLYGLOT!)\n");

  const tree = new IntervalTree();
  tree.insert(1, 5, 'A');
  tree.insert(3, 7, 'B');
  tree.insert(6, 10, 'C');
  tree.insert(8, 12, 'D');

  console.log('Intervals containing 4:', tree.search(4).map(i => i.data));
  console.log('Intervals containing 7:', tree.search(7).map(i => i.data));
  console.log('Intervals overlapping [5, 8]:', tree.searchInterval(5, 8).map(i => i.data));
  console.log('Total intervals:', tree.size());

  console.log("\n🚀 ~3M downloads/week | Interval tree data structure\n");
}
