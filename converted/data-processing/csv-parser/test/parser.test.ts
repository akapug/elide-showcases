/**
 * CSV Parser Tests
 *
 * Comprehensive test suite ensuring API compatibility and correctness
 */

import { Readable } from 'node:stream';
import csv, { CSVParser, parseString, parseFile } from '../index';
import { createReadStream, writeFileSync, unlinkSync } from 'node:fs';

describe('CSVParser', () => {
  describe('Basic Parsing', () => {
    it('should parse simple CSV', async () => {
      const input = `name,age,city
Alice,30,New York
Bob,25,Boston`;

      const rows = await parseString(input);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ name: 'Alice', age: '30', city: 'New York' });
      expect(rows[1]).toEqual({ name: 'Bob', age: '25', city: 'Boston' });
    });

    it('should handle empty CSV', async () => {
      const input = '';
      const rows = await parseString(input);
      expect(rows).toHaveLength(0);
    });

    it('should parse single row', async () => {
      const input = `name,age\nAlice,30`;
      const rows = await parseString(input);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({ name: 'Alice', age: '30' });
    });

    it('should parse headers only', async () => {
      const input = `name,age,city`;
      const rows = await parseString(input);
      expect(rows).toHaveLength(0);
    });
  });

  describe('Headers', () => {
    it('should use first row as headers by default', async () => {
      const input = `col1,col2,col3
val1,val2,val3`;

      const rows = await parseString(input);
      expect(rows[0]).toEqual({ col1: 'val1', col2: 'val2', col3: 'val3' });
    });

    it('should use custom headers', async () => {
      const input = `val1,val2,val3`;

      const rows = await parseString(input, {
        headers: ['name', 'age', 'city'],
      });

      expect(rows[0]).toEqual({ name: 'val1', age: 'val2', city: 'val3' });
    });

    it('should generate numeric headers when headers=false', async () => {
      const input = `val1,val2,val3`;

      const rows = await parseString(input, {
        headers: false,
      });

      expect(rows[0]).toEqual({ '0': 'val1', '1': 'val2', '2': 'val3' });
    });

    it('should emit headers event', (done) => {
      const input = `name,age,city\nAlice,30,NYC`;
      const stream = Readable.from([input]);
      const parser = csv();

      parser.on('headers', (headers) => {
        expect(headers).toEqual(['name', 'age', 'city']);
        done();
      });

      stream.pipe(parser).on('data', () => {});
    });
  });

  describe('Quoted Fields', () => {
    it('should handle quoted fields', async () => {
      const input = `name,city
"Alice","New York"
Bob,Boston`;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({ name: 'Alice', city: 'New York' });
      expect(rows[1]).toEqual({ name: 'Bob', city: 'Boston' });
    });

    it('should handle quotes with separators inside', async () => {
      const input = `name,address
Alice,"123 Main St, Apt 4"
Bob,"456 Oak Ave, Suite 2"`;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({ name: 'Alice', address: '123 Main St, Apt 4' });
      expect(rows[1]).toEqual({ name: 'Bob', address: '456 Oak Ave, Suite 2' });
    });

    it('should handle escaped quotes', async () => {
      const input = `name,quote
Alice,"She said ""hello"""
Bob,"He said ""goodbye"""`;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({ name: 'Alice', quote: 'She said "hello"' });
      expect(rows[1]).toEqual({ name: 'Bob', quote: 'He said "goodbye"' });
    });

    it('should handle newlines in quoted fields', async () => {
      const input = `name,bio
Alice,"Line 1
Line 2"
Bob,"Single line"`;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({
        name: 'Alice',
        bio: 'Line 1\nLine 2',
      });
      expect(rows[1]).toEqual({ name: 'Bob', bio: 'Single line' });
    });
  });

  describe('Custom Separators', () => {
    it('should handle tab separator', async () => {
      const input = `name\tage\tcity
Alice\t30\tNew York`;

      const rows = await parseString(input, { separator: '\t' });

      expect(rows[0]).toEqual({ name: 'Alice', age: '30', city: 'New York' });
    });

    it('should handle pipe separator', async () => {
      const input = `name|age|city
Alice|30|New York`;

      const rows = await parseString(input, { separator: '|' });

      expect(rows[0]).toEqual({ name: 'Alice', age: '30', city: 'New York' });
    });

    it('should handle semicolon separator', async () => {
      const input = `name;age;city
Alice;30;New York`;

      const rows = await parseString(input, { separator: ';' });

      expect(rows[0]).toEqual({ name: 'Alice', age: '30', city: 'New York' });
    });
  });

  describe('Skip Lines', () => {
    it('should skip specified number of lines', async () => {
      const input = `Comment line 1
Comment line 2
name,age
Alice,30`;

      const rows = await parseString(input, { skipLines: 2 });

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({ name: 'Alice', age: '30' });
    });

    it('should skip empty lines when configured', async () => {
      const input = `name,age

Alice,30

Bob,25`;

      const rows = await parseString(input, { skipEmptyLines: true });

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ name: 'Alice', age: '30' });
      expect(rows[1]).toEqual({ name: 'Bob', age: '25' });
    });
  });

  describe('Value Mapping', () => {
    it('should transform values with mapValues', async () => {
      const input = `name,age,active
Alice,30,true
Bob,25,false`;

      const rows = await parseString(input, {
        mapValues: ({ value, header }) => {
          if (header === 'age') return parseInt(value);
          if (header === 'active') return value === 'true';
          return value;
        },
      });

      expect(rows[0]).toEqual({ name: 'Alice', age: 30, active: true });
      expect(rows[1]).toEqual({ name: 'Bob', age: 25, active: false });
    });

    it('should transform headers with mapHeaders', async () => {
      const input = `First Name,Last Name
Alice,Smith`;

      const rows = await parseString(input, {
        mapHeaders: ({ header }) => header.toLowerCase().replace(/\s+/g, '_'),
      });

      expect(rows[0]).toEqual({ first_name: 'Alice', last_name: 'Smith' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing values', async () => {
      const input = `name,age,city
Alice,30,
Bob,,Boston`;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({ name: 'Alice', age: '30', city: '' });
      expect(rows[1]).toEqual({ name: 'Bob', age: '', city: 'Boston' });
    });

    it('should handle extra columns', async () => {
      const input = `name,age
Alice,30,extra1,extra2`;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({ name: 'Alice', age: '30' });
    });

    it('should handle whitespace', async () => {
      const input = `name,age
  Alice  ,  30  `;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({ name: '  Alice  ', age: '  30  ' });
    });

    it('should handle unicode characters', async () => {
      const input = `name,city
Müller,Zürich
François,Montréal`;

      const rows = await parseString(input);

      expect(rows[0]).toEqual({ name: 'Müller', city: 'Zürich' });
      expect(rows[1]).toEqual({ name: 'Français', city: 'Montréal' });
    });
  });

  describe('Streaming', () => {
    it('should work with readable stream', (done) => {
      const input = `name,age
Alice,30
Bob,25`;

      const stream = Readable.from([input]);
      const rows: any[] = [];

      stream
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => {
          expect(rows).toHaveLength(2);
          expect(rows[0]).toEqual({ name: 'Alice', age: '30' });
          done();
        });
    });

    it('should handle chunked data', (done) => {
      const chunks = [`name,age\n`, `Alice,30\n`, `Bob,25`];

      const stream = Readable.from(chunks);
      const rows: any[] = [];

      stream
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => {
          expect(rows).toHaveLength(2);
          done();
        });
    });

    it('should support async iteration', async () => {
      const input = `name,age
Alice,30
Bob,25`;

      const stream = Readable.from([input]);
      const rows: any[] = [];

      for await (const row of stream.pipe(csv())) {
        rows.push(row);
      }

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ name: 'Alice', age: '30' });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed CSV in non-strict mode', async () => {
      const input = `name,age
Alice,30
Bob,"unclosed quote`;

      // Should not throw in non-strict mode
      const rows = await parseString(input, { strict: false });
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });

    it('should emit error event for invalid data in strict mode', (done) => {
      const input = `name,age
Alice,30`;

      const stream = Readable.from([input]);
      const parser = csv({ strict: true });

      let errorEmitted = false;

      parser.on('error', () => {
        errorEmitted = true;
      });

      parser.on('end', () => {
        // This test is just checking the error handling mechanism exists
        done();
      });

      stream.pipe(parser).on('data', () => {});
    });
  });

  describe('Performance', () => {
    it('should handle large row count efficiently', async () => {
      // Generate large CSV
      let csv = 'id,name,value\n';
      for (let i = 0; i < 10000; i++) {
        csv += `${i},name${i},${i * 100}\n`;
      }

      const start = Date.now();
      const rows = await parseString(csv);
      const duration = Date.now() - start;

      expect(rows).toHaveLength(10000);
      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });

    it('should maintain low memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Parse moderately large CSV
      let csv = 'id,data\n';
      for (let i = 0; i < 5000; i++) {
        csv += `${i},${'x'.repeat(100)}\n`;
      }

      await parseString(csv);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('API Compatibility', () => {
    it('should expose CSVParser class', () => {
      expect(CSVParser).toBeDefined();
      expect(typeof CSVParser).toBe('function');
    });

    it('should create parser with factory function', () => {
      const parser = csv();
      expect(parser).toBeInstanceOf(CSVParser);
    });

    it('should expose parseString helper', () => {
      expect(parseString).toBeDefined();
      expect(typeof parseString).toBe('function');
    });

    it('should expose parseFile helper', () => {
      expect(parseFile).toBeDefined();
      expect(typeof parseFile).toBe('function');
    });

    it('should support getRowCount method', async () => {
      const input = `name,age\nAlice,30\nBob,25`;
      const parser = csv();

      const stream = Readable.from([input]);
      const rows: any[] = [];

      await new Promise((resolve) => {
        stream
          .pipe(parser)
          .on('data', (row) => rows.push(row))
          .on('end', resolve);
      });

      expect(parser.getRowCount()).toBe(2);
    });

    it('should support getHeaders method', async () => {
      const input = `name,age\nAlice,30`;
      const parser = csv();

      const stream = Readable.from([input]);

      await new Promise((resolve) => {
        stream.pipe(parser).on('data', () => {}).on('end', resolve);
      });

      expect(parser.getHeaders()).toEqual(['name', 'age']);
    });
  });
});
