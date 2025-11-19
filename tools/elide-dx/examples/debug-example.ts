/**
 * Example: Using the Elide Debugger
 */

import ElideDebugger from '../debugger/src/debugger';
import DevToolsServer from '../debugger/src/devtools-server';

async function main() {
  // Create debugger instance
  const debugger = new ElideDebugger({
    port: 9229,
    host: '127.0.0.1',
    sourceMaps: true,
    pauseOnExceptions: false,
    pauseOnUncaughtExceptions: true
  });

  // Create DevTools server
  const server = new DevToolsServer(9229, '127.0.0.1');

  // Start server and connect debugger
  await server.start();
  await debugger.connect();

  // Create debug session
  const sessionId = server.createSession(debugger);
  const devtoolsUrl = server.getDevToolsUrl(sessionId);

  console.log('Debugger started!');
  console.log(`DevTools URL: ${devtoolsUrl}`);
  console.log('');

  // Set some breakpoints
  const bp1 = await debugger.setBreakpoint('main.ts', 42);
  console.log(`Breakpoint set: ${bp1.id}`);

  // Set conditional breakpoint
  const bp2 = await debugger.setBreakpoint('main.ts', 50, 0, 'x > 10');
  console.log(`Conditional breakpoint set: ${bp2.id}`);

  // Set logpoint
  const lp = await debugger.setLogpoint('main.ts', 60, 'Value of x: {x}');
  console.log(`Logpoint set: ${lp.id}`);

  // Add watch expressions
  const watch1 = debugger.addWatchExpression('myVariable');
  const watch2 = debugger.addWatchExpression('array.length');
  console.log('Watch expressions added');

  // Listen for debugger events
  debugger.on('paused', (data) => {
    console.log('Debugger paused:', data.reason);
    console.log('Call stack:');
    for (const frame of data.callStack) {
      console.log(`  ${frame.functionName} (${frame.location.lineNumber})`);
    }
  });

  debugger.on('resumed', () => {
    console.log('Debugger resumed');
  });

  // Simulate execution pause
  setTimeout(async () => {
    await debugger.pause();

    // Evaluate expression in paused context
    const result = await debugger.evaluate('x + y');
    console.log('Evaluation result:', result);

    // Step through code
    await debugger.stepOver();
    await debugger.stepInto();
    await debugger.stepOut();

    // Resume execution
    await debugger.resume();
  }, 2000);

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\nStopping debugger...');
    await debugger.disconnect();
    await server.stop();
    process.exit(0);
  });
}

main().catch(console.error);
