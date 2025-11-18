/**
 * UnionFS - Union Filesystem
 *
 * Merge multiple filesystem volumes into one.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/unionfs (~500K+ downloads/week)
 *
 * Features:
 * - Merge multiple filesystems
 * - Layer filesystem volumes
 * - Fallback support
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

class UnionFS {
  private volumes: any[] = [];

  use(...fss: any[]): this {
    this.volumes.push(...fss);
    return this;
  }

  readFileSync(path: string): Buffer | string {
    for (const vol of this.volumes) {
      try {
        return vol.readFileSync(path);
      } catch (e) {
        continue;
      }
    }
    throw new Error(\`File not found: \${path}\`);
  }

  existsSync(path: string): boolean {
    return this.volumes.some(vol => vol.existsSync(path));
  }
}

export default UnionFS;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔗 UnionFS - Merge Filesystems for Elide (POLYGLOT!)\n");
  const ufs = new UnionFS();
  console.log("Union filesystem created");
  console.log("\n✅ ~500K+ downloads/week on npm!");
}
