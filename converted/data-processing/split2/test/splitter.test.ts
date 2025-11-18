/**
 * split2 Tests
 *
 * Comprehensive test suite ensuring API compatibility and correctness
 */

import { Readable } from 'node:stream';
import split2, { splitString } from '../index';

describe('split2', () => {
  describe('Basic Splitting', () => {
    it('should split on newlines by default', async () => {
      const input = `line1\nline2\nline3`;
      const lines = await splitString(input);

      expect(lines).toEqual(['line1', 'line2', 'line3']);
    });

    it('should handle empty input', async () => {
      const lines = await splitString('');
      expect(lines).toEqual([]);
    });

    it('should handle single line', async () => {
      const lines = await splitString('single line');
      expect(lines).toEqual(['single line']);
    });

    it('should handle trailing newline', async () => {
      const lines = await splitString('line1\nline2\n');
      expect(lines).toEqual(['line1', 'line2', '']);
    });
  });

  describe('Custom Delimiters', () => {
    it('should split by custom string delimiter', async () => {
      const lines = await splitString('a|b|c', '|');
      expect(lines).toEqual(['a', 'b', 'c']);
    });

    it('should split by tab', async () => {
      const lines = await splitString('a\tb\tc', '\t');
      expect(lines).toEqual(['a', 'b', 'c']);
    });

    it('should split by multiple character delimiter', async () => {
      const lines = await splitString('a||b||c', '||');
      expect(lines).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Regex Delimiters', () => {
    it('should split by regex', async () => {
      const lines = await splitString('a1b2c3d', /\d/);
      expect(lines).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle \\r\\n line endings', async () => {
      const lines = await splitString('line1\r\nline2\r\n', /\r?\n/);
      expect(lines).toEqual(['line1', 'line2', '']);
    });

    it('should split on whitespace', async () => {
      const lines = await splitString('a b\tc\nd', /\s+/);
      expect(lines).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('Mapper Function', () => {
    it('should apply mapper to each line', async () => {
      const lines = await splitString('a\nb\nc', undefined, (line) => line.toUpperCase());
      expect(lines).toEqual(['A', 'B', 'C']);
    });

    it('should parse JSON with mapper', async () => {
      const input = '{"a":1}\n{"b":2}';
      const objs = await splitString(input, undefined, JSON.parse);

      expect(objs).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('should transform lines to objects', async () => {
      const input = 'Alice,30\nBob,25';
      const objs = await splitString(input, undefined, (line) => {
        const [name, age] = line.split(',');
        return { name, age: parseInt(age) };
      });

      expect(objs).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ]);
    });
  });

  describe('Options', () => {
    it('should skip empty lines', async () => {
      const input = 'a\n\nb\n\nc';
      const lines = await splitString(input, undefined, undefined, { skipEmpty: true });

      expect(lines).toEqual(['a', 'b', 'c']);
    });

    it('should respect maxLength', (done) => {
      const input = 'short\n' + 'x'.repeat(100);
      const stream = Readable.from([input]);

      let errorEmitted = false;

      stream
        .pipe(split2({ maxLength: 50 }))
        .on('error', (err) => {
          errorEmitted = true;
          expect(err.message).toContain('exceeds maximum length');
        })
        .on('end', () => {
          expect(errorEmitted).toBe(true);
          done();
        })
        .on('data', () => {});
    });
  });

  describe('Streaming', () => {
    it('should work with readable stream', (done) => {
      const input = 'line1\nline2\nline3';
      const stream = Readable.from([input]);
      const lines: string[] = [];

      stream
        .pipe(split2())
        .on('data', (line) => lines.push(line))
        .on('end', () => {
          expect(lines).toEqual(['line1', 'line2', 'line3']);
          done();
        });
    });

    it('should handle chunked data', (done) => {
      const chunks = ['line1\nli', 'ne2\nline', '3'];
      const stream = Readable.from(chunks);
      const lines: string[] = [];

      stream
        .pipe(split2())
        .on('data', (line) => lines.push(line))
        .on('end', () => {
          expect(lines).toEqual(['line1', 'line2', 'line3']);
          done();
        });
    });

    it('should support async iteration', async () => {
      const input = 'a\nb\nc';
      const stream = Readable.from([input]);
      const lines: string[] = [];

      for await (const line of stream.pipe(split2())) {
        lines.push(line);
      }

      expect(lines).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle consecutive delimiters', async () => {
      const lines = await splitString('a\n\n\nb');
      expect(lines).toEqual(['a', '', '', 'b']);
    });

    it('should handle unicode characters', async () => {
      const lines = await splitString('Hello 世界\nBonjour 🌍');
      expect(lines).toEqual(['Hello 世界', 'Bonjour 🌍']);
    });

    it('should handle very long lines', async () => {
      const longLine = 'x'.repeat(10000);
      const lines = await splitString(longLine);
      expect(lines).toEqual([longLine]);
    });
  });

  describe('API Compatibility', () => {
    it('should return Split2 instance', () => {
      const splitter = split2();
      expect(splitter.constructor.name).toBe('Split2');
    });

    it('should support getLineCount', async () => {
      const splitter = split2();
      const stream = Readable.from(['a\nb\nc']);

      await new Promise((resolve) => {
        stream.pipe(splitter).on('data', () => {}).on('end', resolve);
      });

      expect(splitter.getLineCount()).toBe(3);
    });
  });
});
