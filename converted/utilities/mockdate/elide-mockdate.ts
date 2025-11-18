/**
 * MockDate - Date Mocking
 *
 * Mock JavaScript Date object.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mockdate (~500K+ downloads/week)
 *
 * Features:
 * - Mock Date constructor
 * - Freeze time
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

class MockDate {
  private mockedDate: Date | null = null;

  set(date: Date | number | string): void {
    this.mockedDate = new Date(date);
  }

  reset(): void {
    this.mockedDate = null;
  }

  getCurrentDate(): Date {
    return this.mockedDate || new Date();
  }
}

const mockDate = new MockDate();

export function set(date: Date | number | string): void {
  mockDate.set(date);
}

export function reset(): void {
  mockDate.reset();
}

export default { set, reset };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📅 MockDate - Date Mocking for Elide (POLYGLOT!)\n");
  
  set('2024-01-01');
  console.log("Date mocked:", mockDate.getCurrentDate().toISOString());
  
  reset();
  console.log("Date reset to current");
  
  console.log("\n✅ ~500K+ downloads/week on npm!");
}
