/**
 * Promise Polyfill
 *
 * Lightweight ES6 Promise polyfill.
 * **POLYGLOT SHOWCASE**: Promises for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/promise-polyfill (~500K+ downloads/week)
 */

type Executor<T> = (resolve: (value: T) => void, reject: (reason?: any) => void) => void;

export class PromisePolyfill<T> {
  private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
  private value: any;
  private handlers: Array<{ onFulfilled?: any; onRejected?: any }> = [];

  constructor(executor: Executor<T>) {
    try {
      executor(
        (value) => this.resolve(value),
        (reason) => this.reject(reason)
      );
    } catch (error) {
      this.reject(error);
    }
  }

  private resolve(value: T): void {
    if (this.state !== 'pending') return;
    this.state = 'fulfilled';
    this.value = value;
    this.handlers.forEach(h => h.onFulfilled?.(value));
  }

  private reject(reason: any): void {
    if (this.state !== 'pending') return;
    this.state = 'rejected';
    this.value = reason;
    this.handlers.forEach(h => h.onRejected?.(reason));
  }

  then<U>(onFulfilled?: (value: T) => U, onRejected?: (reason: any) => any): PromisePolyfill<U> {
    return new PromisePolyfill<U>((resolve, reject) => {
      const handle = () => {
        if (this.state === 'fulfilled') {
          try {
            resolve(onFulfilled ? onFulfilled(this.value) : this.value);
          } catch (error) {
            reject(error);
          }
        } else if (this.state === 'rejected') {
          if (onRejected) {
            try {
              resolve(onRejected(this.value));
            } catch (error) {
              reject(error);
            }
          } else {
            reject(this.value);
          }
        }
      };

      if (this.state !== 'pending') {
        setTimeout(handle, 0);
      } else {
        this.handlers.push({ onFulfilled, onRejected });
      }
    });
  }

  catch(onRejected: (reason: any) => any): PromisePolyfill<T> {
    return this.then(undefined, onRejected);
  }

  static resolve<T>(value: T): PromisePolyfill<T> {
    return new PromisePolyfill(resolve => resolve(value));
  }

  static reject(reason: any): PromisePolyfill<never> {
    return new PromisePolyfill((_, reject) => reject(reason));
  }
}

export default PromisePolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🤝 Promise Polyfill (POLYGLOT!)\n");
  
  const p = new PromisePolyfill((resolve) => {
    setTimeout(() => resolve('Done!'), 100);
  });
  
  p.then(value => console.log('Resolved:', value));
  console.log("\n  ✓ ~500K+ downloads/week!");
}
