/**
 * through2 Tests
 *
 * Comprehensive test suite ensuring API compatibility and correctness
 */

import { Readable } from 'node:stream';
import through2, { map, filter, batch, transformArray } from '../index';

describe('through2', () => {
  describe('Basic Usage', () => {
    it('should pass through data unchanged by default', (done) => {
      const input = ['a', 'b', 'c'];
      const output: string[] = [];

      Readable.from(input)
        .pipe(through2.obj())
        .on('data', (item) => output.push(item))
        .on('end', () => {
          expect(output).toEqual(input);
          done();
        });
    });

    it('should transform data with function', (done) => {
      const input = ['a', 'b', 'c'];
      const output: string[] = [];

      Readable.from(input)
        .pipe(
          through2.obj(function (item, enc, callback) {
            this.push(item.toUpperCase());
            callback();
          })
        )
        .on('data', (item) => output.push(item))
        .on('end', () => {
          expect(output).toEqual(['A', 'B', 'C']);
          done();
        });
    });

    it('should support flush function', (done) => {
      const input = ['a', 'b'];
      const output: string[] = [];

      Readable.from(input)
        .pipe(
          through2.obj(
            function (item, enc, callback) {
              this.push(item);
              callback();
            },
            function (callback) {
              this.push('end');
              callback();
            }
          )
        )
        .on('data', (item) => output.push(item))
        .on('end', () => {
          expect(output).toEqual(['a', 'b', 'end']);
          done();
        });
    });
  });

  describe('Object Mode', () => {
    it('should work in object mode', (done) => {
      const input = [{ a: 1 }, { b: 2 }];
      const output: any[] = [];

      Readable.from(input)
        .pipe(through2.obj())
        .on('data', (item) => output.push(item))
        .on('end', () => {
          expect(output).toEqual(input);
          done();
        });
    });

    it('should transform objects', (done) => {
      const input = [{ val: 1 }, { val: 2 }];
      const output: any[] = [];

      Readable.from(input)
        .pipe(
          through2.obj(function (obj, enc, callback) {
            obj.doubled = obj.val * 2;
            this.push(obj);
            callback();
          })
        )
        .on('data', (item) => output.push(item))
        .on('end', () => {
          expect(output[0].doubled).toBe(2);
          expect(output[1].doubled).toBe(4);
          done();
        });
    });
  });

  describe('Buffer Mode', () => {
    it('should work with buffers', (done) => {
      const input = [Buffer.from('hello'), Buffer.from('world')];
      const output: Buffer[] = [];

      Readable.from(input)
        .pipe(through2())
        .on('data', (chunk) => output.push(chunk))
        .on('end', () => {
          expect(output).toHaveLength(2);
          expect(output[0].toString()).toBe('hello');
          expect(output[1].toString()).toBe('world');
          done();
        });
    });

    it('should transform buffers', (done) => {
      const input = [Buffer.from('hello')];
      const output: string[] = [];

      Readable.from(input)
        .pipe(
          through2(function (chunk, enc, callback) {
            this.push(chunk.toString().toUpperCase());
            callback();
          })
        )
        .on('data', (chunk) => output.push(chunk))
        .on('end', () => {
          expect(output[0]).toBe('HELLO');
          done();
        });
    });
  });

  describe('Error Handling', () => {
    it('should emit errors from transform', (done) => {
      const input = ['a', 'b'];

      const stream = Readable.from(input).pipe(
        through2.obj(function (item, enc, callback) {
          if (item === 'b') {
            callback(new Error('Test error'));
          } else {
            this.push(item);
            callback();
          }
        })
      );

      stream.on('error', (err) => {
        expect(err.message).toBe('Test error');
        done();
      });

      stream.on('data', () => {});
    });

    it('should handle thrown errors', (done) => {
      const input = ['a'];

      const stream = Readable.from(input).pipe(
        through2.obj(function (item, enc, callback) {
          throw new Error('Thrown error');
        })
      );

      stream.on('error', (err) => {
        expect(err.message).toBe('Thrown error');
        done();
      });

      stream.on('data', () => {});
    });
  });

  describe('Options', () => {
    it('should accept stream options', (done) => {
      const stream = through2({ highWaterMark: 1 });
      expect(stream).toBeDefined();
      done();
    });

    it('should support custom options', (done) => {
      const stream = through2(
        { objectMode: true, highWaterMark: 10 },
        function (item, enc, callback) {
          this.push(item);
          callback();
        }
      );

      expect(stream).toBeDefined();
      done();
    });
  });

  describe('Helper Functions', () => {
    describe('map', () => {
      it('should map items', (done) => {
        const input = [1, 2, 3];
        const output: number[] = [];

        Readable.from(input)
          .pipe(map((n) => n * 2))
          .on('data', (item) => output.push(item))
          .on('end', () => {
            expect(output).toEqual([2, 4, 6]);
            done();
          });
      });
    });

    describe('filter', () => {
      it('should filter items', (done) => {
        const input = [1, 2, 3, 4, 5];
        const output: number[] = [];

        Readable.from(input)
          .pipe(filter((n) => n % 2 === 0))
          .on('data', (item) => output.push(item))
          .on('end', () => {
            expect(output).toEqual([2, 4]);
            done();
          });
      });
    });

    describe('batch', () => {
      it('should batch items', (done) => {
        const input = [1, 2, 3, 4, 5];
        const output: number[][] = [];

        Readable.from(input)
          .pipe(batch(2))
          .on('data', (batch) => output.push(batch))
          .on('end', () => {
            expect(output).toHaveLength(3);
            expect(output[0]).toEqual([1, 2]);
            expect(output[1]).toEqual([3, 4]);
            expect(output[2]).toEqual([5]);
            done();
          });
      });
    });

    describe('transformArray', () => {
      it('should transform array', async () => {
        const input = [1, 2, 3];
        const output = await transformArray(
          input,
          function (item, enc, callback) {
            this.push(item * 2);
            callback();
          },
          undefined,
          { objectMode: true }
        );

        expect(output).toEqual([2, 4, 6]);
      });
    });
  });

  describe('Async Iteration', () => {
    it('should support async iteration', async () => {
      const input = [1, 2, 3];
      const output: number[] = [];

      const stream = Readable.from(input).pipe(
        through2.obj(function (item, enc, callback) {
          this.push(item * 2);
          callback();
        })
      );

      for await (const item of stream) {
        output.push(item);
      }

      expect(output).toEqual([2, 4, 6]);
    });
  });

  describe('API Compatibility', () => {
    it('should expose through2.obj', () => {
      expect(typeof through2.obj).toBe('function');
    });

    it('should expose through2.ctor', () => {
      expect(typeof through2.ctor).toBe('function');
    });

    it('should create custom constructor', () => {
      const Custom = through2.ctor({ objectMode: true });
      const stream = new Custom();
      expect(stream).toBeDefined();
    });
  });
});
