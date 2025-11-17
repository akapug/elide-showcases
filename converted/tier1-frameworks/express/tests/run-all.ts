/**
 * Test Runner - Runs all Express tests
 *
 * Executes all test suites and reports results
 */

import { runRoutingTests } from './routing.test';
import { runMiddlewareTests } from './middleware.test';
import { runErrorHandlingTests } from './error-handling.test';
import { runRequestResponseTests } from './request-response.test';
import { runIntegrationTests } from './integration.test';

/**
 * Run all test suites
 */
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Express on Elide - Test Suite      ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const startTime = Date.now();
  let failed = false;

  try {
    // Run routing tests (7 tests)
    await runRoutingTests();

    // Run middleware tests (6 tests)
    await runMiddlewareTests();

    // Run error handling tests (4 tests)
    await runErrorHandlingTests();

    // Run request/response tests (7 tests)
    await runRequestResponseTests();

    // Run integration tests (4 tests)
    await runIntegrationTests();

    const duration = Date.now() - startTime;

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   ✓ ALL 28 TESTS PASSED!             ║');
    console.log(`║   Duration: ${duration}ms${' '.repeat(23 - String(duration).length)}║`);
    console.log('╚═══════════════════════════════════════╝\n');
  } catch (err) {
    failed = true;
    console.error('\n╔═══════════════════════════════════════╗');
    console.error('║   ✗ TESTS FAILED                      ║');
    console.error('╚═══════════════════════════════════════╝\n');
    console.error(err);
    process.exit(1);
  }
}

// Run tests
runAllTests();
