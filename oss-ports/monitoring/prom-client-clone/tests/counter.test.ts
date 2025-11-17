/**
 * Counter Tests
 */

import { Counter, Registry } from '../src';

describe('Counter', () => {
  let registry: Registry;

  beforeEach(() => {
    registry = new Registry();
  });

  describe('basic functionality', () => {
    it('should increment counter', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        registers: [registry],
      });

      counter.inc();
      expect(counter.get()).toBe(1);

      counter.inc(5);
      expect(counter.get()).toBe(6);
    });

    it('should throw on negative increment', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        registers: [registry],
      });

      expect(() => counter.inc(-1)).toThrow();
    });

    it('should reset counter', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        registers: [registry],
      });

      counter.inc(10);
      counter.reset();
      expect(counter.get()).toBe(0);
    });
  });

  describe('labels', () => {
    it('should handle labeled metrics', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        labelNames: ['method', 'status'],
        registers: [registry],
      });

      counter.inc({ method: 'GET', status: '200' }, 5);
      counter.inc({ method: 'POST', status: '201' }, 3);

      const child1 = counter.labels({ method: 'GET', status: '200' });
      expect(child1.get()).toBe(5);

      const child2 = counter.labels({ method: 'POST', status: '201' });
      expect(child2.get()).toBe(3);
    });

    it('should validate labels', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        labelNames: ['method', 'status'],
        registers: [registry],
      });

      // Missing label
      expect(() => counter.inc({ method: 'GET' } as any)).toThrow();

      // Unknown label
      expect(() =>
        counter.inc({ method: 'GET', status: '200', invalid: 'test' } as any)
      ).toThrow();
    });

    it('should remove labeled child', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        labelNames: ['method'],
        registers: [registry],
      });

      counter.inc({ method: 'GET' }, 5);
      expect(counter.childCount).toBe(1);

      counter.remove({ method: 'GET' });
      expect(counter.childCount).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to Prometheus format', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        registers: [registry],
      });

      counter.inc(42);

      const output = counter.serialize();
      expect(output).toContain('# HELP test_counter Test counter');
      expect(output).toContain('# TYPE test_counter counter');
      expect(output).toContain('test_counter 42');
    });

    it('should serialize labeled metrics', () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        labelNames: ['method'],
        registers: [registry],
      });

      counter.inc({ method: 'GET' }, 10);
      counter.inc({ method: 'POST' }, 20);

      const output = counter.serialize();
      expect(output).toContain('test_counter{method="GET"} 10');
      expect(output).toContain('test_counter{method="POST"} 20');
    });
  });

  describe('registry integration', () => {
    it('should register with registry', async () => {
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter',
        registers: [registry],
      });

      counter.inc(5);

      const metrics = await registry.metrics();
      expect(metrics).toContain('test_counter 5');
    });

    it('should prevent duplicate registration', () => {
      new Counter({
        name: 'test_counter',
        help: 'Test counter',
        registers: [registry],
      });

      expect(() => {
        new Counter({
          name: 'test_counter',
          help: 'Test counter',
          registers: [registry],
        });
      }).toThrow();
    });
  });
});
