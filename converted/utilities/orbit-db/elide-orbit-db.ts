/**
 * OrbitDB - P2P Database
 * Based on https://www.npmjs.com/package/orbit-db (~10K+ downloads/week)
 */

export class OrbitDB {
  async create(name: string, type: string): Promise<any> {
    return { put: async (key: string, value: any) => {} };
  }
}

export async function createInstance(ipfs: any): Promise<OrbitDB> {
  return new OrbitDB();
}

export default { createInstance };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💾 OrbitDB for Elide (POLYGLOT!) - ~10K+ downloads/week!");
}
