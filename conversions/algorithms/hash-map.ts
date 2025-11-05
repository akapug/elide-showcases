export class HashMap<K, V> {
  private map = new Map<K, V>();
  set(key: K, value: V) { this.map.set(key, value); }
  get(key: K): V | undefined { return this.map.get(key); }
  has(key: K): boolean { return this.map.has(key); }
  delete(key: K): boolean { return this.map.delete(key); }
  get size() { return this.map.size; }
  keys() { return Array.from(this.map.keys()); }
  values() { return Array.from(this.map.values()); }
}
if (import.meta.url.includes("hash-map")) {
  const m = new HashMap<string, number>();
  m.set("a", 1); m.set("b", 2);
  console.log("✅", m.get("a"), m.size);
}
