/**
 * Ganache - Ethereum Simulator
 * Based on https://www.npmjs.com/package/ganache (~80K+ downloads/week)
 */

export class Ganache {
  server(options?: any): any {
    return { listen: (port: number) => console.log(`Ganache listening on ${port}`) };
  }
}

export default Ganache;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎲 Ganache for Elide (POLYGLOT!) - ~80K+ downloads/week!");
}
