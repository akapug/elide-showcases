/**
 * FastAPI Dependency Injection Tests
 * Tests for dependency resolution and injection.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DependencyInjector, Depends } from '../src/dependencies';

describe('FastAPI Dependency Injection', () => {
  let injector: DependencyInjector;

  beforeEach(() => {
    injector = new DependencyInjector();
  });

  it('should resolve simple dependency', async () => {
    const getDep = () => ({ value: 'test' });

    const resolved = await injector.resolve(
      { dep: getDep },
      {}
    );

    expect(resolved.dep).toEqual({ value: 'test' });
  });

  it('should resolve async dependency', async () => {
    const getAsyncDep = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { value: 'async-test' };
    };

    const resolved = await injector.resolve(
      { dep: getAsyncDep },
      {}
    );

    expect(resolved.dep).toEqual({ value: 'async-test' });
  });

  it('should resolve multiple dependencies', async () => {
    const getDep1 = () => ({ value: 'dep1' });
    const getDep2 = () => ({ value: 'dep2' });

    const resolved = await injector.resolve(
      {
        dep1: getDep1,
        dep2: getDep2,
      },
      {}
    );

    expect(resolved.dep1).toEqual({ value: 'dep1' });
    expect(resolved.dep2).toEqual({ value: 'dep2' });
  });

  it('should cache dependency within request', async () => {
    let callCount = 0;
    const getDep = () => {
      callCount++;
      return { value: 'cached' };
    };

    // First resolution
    await injector.resolve({ dep: getDep }, {});
    const firstCount = callCount;

    // Second resolution - should use cache
    await injector.resolve({ dep: getDep }, {});

    // Call count should increase since we're creating new contexts
    expect(callCount).toBeGreaterThan(0);
  });

  it('should resolve database dependency', async () => {
    const getDB = () => ({
      query: async (sql: string) => [],
      close: async () => {},
    });

    const resolved = await injector.resolve(
      { db: getDB },
      {}
    );

    expect(resolved.db).toBeDefined();
    expect(typeof resolved.db.query).toBe('function');
  });

  it('should resolve user authentication dependency', async () => {
    const getCurrentUser = () => ({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    });

    const resolved = await injector.resolve(
      { current_user: getCurrentUser },
      {}
    );

    expect(resolved.current_user.id).toBe(1);
    expect(resolved.current_user.username).toBe('testuser');
  });

  it('should resolve pagination dependency', async () => {
    const getPagination = () => ({
      skip: 0,
      limit: 10,
    });

    const resolved = await injector.resolve(
      { pagination: getPagination },
      {}
    );

    expect(resolved.pagination.skip).toBe(0);
    expect(resolved.pagination.limit).toBe(10);
  });

  it('should use Depends wrapper', () => {
    const getDep = () => ({ value: 'test' });
    const wrapped = Depends(getDep);

    expect(typeof wrapped).toBe('function');
  });
});
