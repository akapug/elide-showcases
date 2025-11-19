import Koa from '../src/koa.ts';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function testBasicMiddleware() {
  console.log('Testing basic middleware...');
  const app = new Koa();

  const calls: string[] = [];
  app.use(async (ctx, next) => {
    calls.push('1');
    await next();
    calls.push('4');
  });

  app.use(async (ctx, next) => {
    calls.push('2');
    await next();
    calls.push('3');
  });

  const callback = app.callback();
  const mockReq = { method: 'GET', url: '/', headers: {} };
  const mockRes = {
    statusCode: 200,
    setHeader: () => {},
    end: () => {}
  };

  await callback(mockReq, mockRes);

  assert(calls.join('') === '1234', 'Middleware should cascade correctly');
  console.log('✓ Basic middleware test passed');
}

async function testContext() {
  console.log('Testing context properties...');
  const app = new Koa();

  let capturedCtx: any;
  app.use(async ctx => {
    capturedCtx = ctx;
    ctx.body = { test: true };
  });

  const callback = app.callback();
  await callback(
    { method: 'GET', url: '/test?q=value', headers: { host: 'localhost' } },
    { statusCode: 200, setHeader: () => {}, end: () => {} }
  );

  assert(capturedCtx.method === 'GET', 'Method should be GET');
  assert(capturedCtx.path === '/test', 'Path should be parsed');
  assert(capturedCtx.query.q === 'value', 'Query should be parsed');
  console.log('✓ Context test passed');
}

async function runTests() {
  console.log('\n=== Running Koa Clone Tests ===\n');

  const tests = [testBasicMiddleware, testContext];

  let passed = 0;
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (err: any) {
      console.error(`✗ Test failed: ${err.message}`);
    }
  }

  console.log(`\n=== Results: ${passed}/${tests.length} passed ===\n`);
}

runTests();
