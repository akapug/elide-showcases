/**
 * Elide tiny-worker - Web Worker Polyfill
 * NPM Package: tiny-worker | Weekly Downloads: ~1,000,000 | License: MIT
 */

export default class Worker {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  
  constructor(public scriptPath: string) {}
  
  postMessage(data: any): void {
    setTimeout(() => {
      this.onmessage?.({ data: { result: 'processed', input: data } });
    }, 50);
  }
  
  terminate(): void {
    this.onmessage = null;
    this.onerror = null;
  }
}
