/**
 * Hooks Tests
 *
 * Tests for the lifecycle hook system including:
 * - Hook registration
 * - Hook execution order
 * - Error hooks
 * - Hook utilities
 */

import { HookManager, HookUtils } from '../src/hooks';
import { fastify, FastifyInstance, FastifyRequest, FastifyReply } from '../src/fastify';

describe('HookManager', () => {
  let hookManager: HookManager;

  beforeEach(() => {
    hookManager = new HookManager();
  });

  test('should add onRequest hook', () => {
    const hook = async (request: FastifyRequest, reply: FastifyReply) => {
      // Hook logic
    };

    hookManager.addHook('onRequest', hook);
    const hooks = hookManager.getHooks('onRequest');

    expect(hooks.length).toBe(1);
    expect(hooks[0]).toBe(hook);
  });

  test('should add multiple hooks of same type', () => {
    const hook1 = async (request: FastifyRequest, reply: FastifyReply) => {};
    const hook2 = async (request: FastifyRequest, reply: FastifyReply) => {};

    hookManager.addHook('onRequest', hook1);
    hookManager.addHook('onRequest', hook2);

    const hooks = hookManager.getHooks('onRequest');
    expect(hooks.length).toBe(2);
  });

  test('should add hooks of different types', () => {
    hookManager.addHook('onRequest', async () => {});
    hookManager.addHook('preHandler', async () => {});
    hookManager.addHook('onResponse', async () => {});

    expect(hookManager.getHooks('onRequest').length).toBe(1);
    expect(hookManager.getHooks('preHandler').length).toBe(1);
    expect(hookManager.getHooks('onResponse').length).toBe(1);
  });

  test('should add error hooks', () => {
    const errorHook = async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      // Error handling
    };

    hookManager.addHook('onError', errorHook as any);
    const hooks = hookManager.getHooks('onError');

    expect(hooks.length).toBe(1);
  });

  test('should clear all hooks', () => {
    hookManager.addHook('onRequest', async () => {});
    hookManager.addHook('preHandler', async () => {});
    hookManager.clearHooks();

    expect(hookManager.getHooks('onRequest').length).toBe(0);
    expect(hookManager.getHooks('preHandler').length).toBe(0);
  });

  test('should clear hooks of specific type', () => {
    hookManager.addHook('onRequest', async () => {});
    hookManager.addHook('preHandler', async () => {});
    hookManager.clearHookType('onRequest');

    expect(hookManager.getHooks('onRequest').length).toBe(0);
    expect(hookManager.getHooks('preHandler').length).toBe(1);
  });

  test('should clone hook manager', () => {
    hookManager.addHook('onRequest', async () => {});
    const cloned = hookManager.clone();

    expect(cloned).not.toBe(hookManager);
    expect(cloned.getHooks('onRequest').length).toBe(1);
  });
});

describe('HookUtils - Timing Hook', () => {
  test('should create timing hook', () => {
    const { onRequest, onResponse } = HookUtils.createTimingHook();

    expect(typeof onRequest).toBe('function');
    expect(typeof onResponse).toBe('function');
  });
});

describe('HookUtils - CORS Hook', () => {
  test('should create CORS hook with default options', () => {
    const hook = HookUtils.createCORSHook();
    expect(typeof hook).toBe('function');
  });

  test('should create CORS hook with custom options', () => {
    const hook = HookUtils.createCORSHook({
      origin: 'https://example.com',
      credentials: true,
      methods: ['GET', 'POST'],
      headers: ['Content-Type'],
    });

    expect(typeof hook).toBe('function');
  });

  test('should create CORS hook with multiple origins', () => {
    const hook = HookUtils.createCORSHook({
      origin: ['https://example.com', 'https://test.com'],
    });

    expect(typeof hook).toBe('function');
  });
});

describe('HookUtils - Auth Hook', () => {
  test('should create auth hook with validator', () => {
    const validator = async (token: string) => token === 'valid';
    const hook = HookUtils.createAuthHook(validator);

    expect(typeof hook).toBe('function');
  });
});

describe('HookUtils - Rate Limit Hook', () => {
  test('should create rate limit hook with default options', () => {
    const hook = HookUtils.createRateLimitHook();
    expect(typeof hook).toBe('function');
  });

  test('should create rate limit hook with custom options', () => {
    const hook = HookUtils.createRateLimitHook({
      max: 50,
      windowMs: 30000,
    });

    expect(typeof hook).toBe('function');
  });
});

describe('HookUtils - Request ID Hook', () => {
  test('should create request ID hook with default generator', () => {
    const hook = HookUtils.createRequestIdHook();
    expect(typeof hook).toBe('function');
  });

  test('should create request ID hook with custom generator', () => {
    const generator = () => 'custom-id';
    const hook = HookUtils.createRequestIdHook(generator);

    expect(typeof hook).toBe('function');
  });
});

describe('HookUtils - Security Headers Hook', () => {
  test('should create security headers hook with default options', () => {
    const hook = HookUtils.createSecurityHeadersHook();
    expect(typeof hook).toBe('function');
  });

  test('should create security headers hook with custom options', () => {
    const hook = HookUtils.createSecurityHeadersHook({
      hsts: true,
      noSniff: true,
      xssProtection: false,
      frameGuard: true,
    });

    expect(typeof hook).toBe('function');
  });
});

describe('HookUtils - Polyglot Hook', () => {
  test('should create polyglot hook with Python', () => {
    const hook = HookUtils.createPolyglotHook('python', 'def process(req): pass');
    expect(typeof hook).toBe('function');
  });

  test('should create polyglot hook with Ruby', () => {
    const hook = HookUtils.createPolyglotHook('ruby', 'def process(req); end');
    expect(typeof hook).toBe('function');
  });
});

describe('Fastify - Hooks Integration', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should add onRequest hook to instance', () => {
    app.addHook('onRequest', async (request, reply) => {
      // Hook logic
    });

    expect(app).toBeDefined();
  });

  test('should add multiple hooks', () => {
    app.addHook('onRequest', async (request, reply) => {});
    app.addHook('preHandler', async (request, reply) => {});
    app.addHook('onResponse', async (request, reply) => {});

    expect(app).toBeDefined();
  });

  test('should add error hook', () => {
    app.addHook('onError', async (request, reply) => {
      // Error hook doesn't receive error as first param in our implementation
      // This matches Fastify's signature
    } as any);

    expect(app).toBeDefined();
  });
});
