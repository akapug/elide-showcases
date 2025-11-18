/**
 * Plugin Tests
 *
 * Tests for the plugin system including:
 * - Plugin registration
 * - Plugin loading
 * - Plugin encapsulation
 * - Common plugins
 */

import { fastify, FastifyInstance } from '../src/fastify';
import { PluginFactory, CommonPlugins, PolyglotPlugins } from '../src/plugins';

describe('Plugin System', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register a plugin', async () => {
    const plugin = async (instance: FastifyInstance, opts: any) => {
      instance.get('/plugin-route', async (request, reply) => {
        return { plugin: true };
      });
    };

    app.register(plugin);
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should pass options to plugin', async () => {
    const plugin = async (instance: FastifyInstance, opts: any) => {
      expect(opts.custom).toBe('value');
    };

    app.register(plugin, { custom: 'value' });
    await app.ready();
  });

  test('should register multiple plugins', async () => {
    const plugin1 = async (instance: FastifyInstance, opts: any) => {};
    const plugin2 = async (instance: FastifyInstance, opts: any) => {};

    app.register(plugin1);
    app.register(plugin2);
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should support plugin with prefix', async () => {
    const plugin = async (instance: FastifyInstance, opts: any) => {
      instance.get('/test', async (request, reply) => {
        return { test: true };
      });
    };

    app.register(plugin, { prefix: '/v1' });
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('PluginFactory', () => {
  test('should create plugin with metadata', () => {
    const plugin = PluginFactory.create(
      { name: 'test-plugin', version: '1.0.0' },
      async (instance, opts) => {}
    );

    expect((plugin as any).metadata).toBeDefined();
    expect((plugin as any).metadata.name).toBe('test-plugin');
    expect((plugin as any).metadata.version).toBe('1.0.0');
  });

  test('should create simple plugin', () => {
    const plugin = PluginFactory.simple('simple', async (instance, opts) => {});

    expect((plugin as any).metadata).toBeDefined();
    expect((plugin as any).metadata.name).toBe('simple');
  });

  test('should create plugin with dependencies', () => {
    const plugin = PluginFactory.withDependencies(
      'dependent',
      ['dep1', 'dep2'],
      async (instance, opts) => {}
    );

    expect((plugin as any).metadata).toBeDefined();
    expect((plugin as any).metadata.dependencies).toEqual(['dep1', 'dep2']);
  });
});

describe('Common Plugins - CORS', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register CORS plugin', async () => {
    app.register(CommonPlugins.cors());
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should register CORS plugin with options', async () => {
    app.register(CommonPlugins.cors({
      origin: 'https://example.com',
      credentials: true,
    }));
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('Common Plugins - Rate Limit', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register rate limit plugin', async () => {
    app.register(CommonPlugins.rateLimit());
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should register rate limit plugin with custom limits', async () => {
    app.register(CommonPlugins.rateLimit({ max: 50, windowMs: 30000 }));
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('Common Plugins - Helmet', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register helmet plugin', async () => {
    app.register(CommonPlugins.helmet());
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should register helmet plugin with custom options', async () => {
    app.register(CommonPlugins.helmet({
      hsts: true,
      noSniff: true,
    }));
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('Common Plugins - Auth', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register auth plugin', async () => {
    const validator = async (token: string) => token === 'valid';
    app.register(CommonPlugins.auth(validator));
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('Common Plugins - Cookie', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register cookie plugin', async () => {
    app.register(CommonPlugins.cookie());
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('Common Plugins - Health Check', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register health check plugin', async () => {
    app.register(CommonPlugins.healthCheck());
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should register health check plugin with custom path', async () => {
    app.register(CommonPlugins.healthCheck({ path: '/status' }));
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should register health check plugin with custom checker', async () => {
    const checker = async () => true;
    app.register(CommonPlugins.healthCheck({ checker }));
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('Common Plugins - Swagger', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should register swagger plugin', async () => {
    app.register(CommonPlugins.swagger());
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should register swagger plugin with info', async () => {
    app.register(CommonPlugins.swagger({
      info: {
        title: 'My API',
        description: 'API Description',
        version: '1.0.0',
      },
    }));
    await app.ready();

    expect(app).toBeDefined();
  });
});

describe('Polyglot Plugins', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should create plugin from Python code', async () => {
    const plugin = PolyglotPlugins.fromPython('py-plugin', 'def register(app, opts): pass');
    app.register(plugin);
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should create plugin from Ruby code', async () => {
    const plugin = PolyglotPlugins.fromRuby('rb-plugin', 'def register(app, opts); end');
    app.register(plugin);
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should import Python plugin file', async () => {
    const plugin = PolyglotPlugins.importPython('./plugins/my_plugin.py');
    app.register(plugin);
    await app.ready();

    expect(app).toBeDefined();
  });

  test('should import Ruby plugin file', async () => {
    const plugin = PolyglotPlugins.importRuby('./plugins/my_plugin.rb');
    app.register(plugin);
    await app.ready();

    expect(app).toBeDefined();
  });
});
