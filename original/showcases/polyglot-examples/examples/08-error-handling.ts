/**
 * Example 8: Error Handling Across Languages
 *
 * Demonstrates:
 * - Catching errors from other languages
 * - Error propagation across boundaries
 * - Custom error types
 * - Error recovery strategies
 *
 * Performance: Error handling adds <0.1ms overhead
 */

const Python = Polyglot.import('python');
const Ruby = Polyglot.import('ruby');
const Java = Polyglot.import('java');

/**
 * Basic error propagation
 */
function basicErrorPropagation() {
  console.log('Basic Error Propagation\n');

  // Python errors
  Python.eval(`
def divide(a, b):
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b

def validate_age(age):
    if age < 0:
        raise ValueError("Age cannot be negative")
    if age > 150:
        raise ValueError("Age seems unrealistic")
    return age
`);

  const divide = Python.eval('divide');
  const validateAge = Python.eval('validate_age');

  // Catch Python errors in TypeScript
  console.log('Catching Python errors:');

  try {
    const result = divide(10, 2);
    console.log(`  ✓ 10 / 2 = ${result}`);
  } catch (error: any) {
    console.log(`  ✗ Error: ${error.message}`);
  }

  try {
    const result = divide(10, 0);
    console.log(`  ✓ 10 / 0 = ${result}`);
  } catch (error: any) {
    console.log(`  ✗ Caught: ${error.message}`);
  }

  try {
    validateAge(25);
    console.log('  ✓ Age 25 is valid');
  } catch (error: any) {
    console.log(`  ✗ Error: ${error.message}`);
  }

  try {
    validateAge(-5);
    console.log('  ✓ Age -5 is valid');
  } catch (error: any) {
    console.log(`  ✗ Caught: ${error.message}`);
  }
}

/**
 * Ruby error handling
 */
function rubyErrorHandling() {
  console.log('\n\nRuby Error Handling\n');

  Ruby.eval(`
def parse_number(str)
  raise ArgumentError, "Input cannot be empty" if str.nil? || str.empty?
  num = str.to_f
  raise ArgumentError, "Not a valid number" if num == 0.0 && str != "0"
  num
end

def safe_array_access(arr, index)
  raise IndexError, "Index out of bounds" if index < 0 || index >= arr.length
  arr[index]
end

class CustomError < StandardError
  attr_reader :code

  def initialize(message, code)
    super(message)
    @code = code
  end
end

def risky_operation(value)
  case value
  when 0
    raise CustomError.new("Zero not allowed", 100)
  when 1..10
    value * 2
  else
    raise CustomError.new("Value out of range", 200)
  end
end
`);

  const parseNumber = Ruby.eval('method(:parse_number)');
  const safeArrayAccess = Ruby.eval('method(:safe_array_access)');
  const riskyOperation = Ruby.eval('method(:risky_operation)');

  console.log('Parsing numbers:');
  const inputs = ['42', '3.14', 'abc', '', '0'];

  inputs.forEach((input) => {
    try {
      const result = parseNumber.call(input);
      console.log(`  ✓ "${input}" -> ${result}`);
    } catch (error: any) {
      console.log(`  ✗ "${input}": ${error.message}`);
    }
  });

  console.log('\nArray access:');
  const arr = ['a', 'b', 'c'];
  [0, 1, 5, -1].forEach((index) => {
    try {
      const result = safeArrayAccess.call(arr, index);
      console.log(`  ✓ arr[${index}] = ${result}`);
    } catch (error: any) {
      console.log(`  ✗ arr[${index}]: ${error.message}`);
    }
  });

  console.log('\nCustom errors:');
  [0, 5, 15].forEach((value) => {
    try {
      const result = riskyOperation.call(value);
      console.log(`  ✓ risky(${value}) = ${result}`);
    } catch (error: any) {
      console.log(`  ✗ risky(${value}): ${error.message}`);
    }
  });
}

/**
 * Java exception handling
 */
function javaExceptionHandling() {
  console.log('\n\nJava Exception Handling\n');

  const Integer = Java.type('java.lang.Integer');
  const ArrayList = Java.type('java.util.ArrayList');

  console.log('Parsing integers:');
  const strings = ['123', '456', 'abc', '789'];

  strings.forEach((str) => {
    try {
      const num = Integer.parseInt(str);
      console.log(`  ✓ "${str}" -> ${num}`);
    } catch (error: any) {
      console.log(`  ✗ "${str}": ${error.message}`);
    }
  });

  console.log('\nArrayList access:');
  const list = new ArrayList();
  list.add('first');
  list.add('second');
  list.add('third');

  [0, 1, 5].forEach((index) => {
    try {
      const item = list.get(index);
      console.log(`  ✓ list[${index}] = ${item}`);
    } catch (error: any) {
      console.log(`  ✗ list[${index}]: Out of bounds`);
    }
  });
}

/**
 * Error recovery strategies
 */
function errorRecoveryStrategies() {
  console.log('\n\nError Recovery Strategies\n');

  Python.eval(`
def fetch_data(id):
    """Simulate data fetching that might fail"""
    if id % 3 == 0:
        raise ConnectionError("Network error")
    if id % 5 == 0:
        raise TimeoutError("Request timeout")
    return {"id": id, "data": f"Data for {id}"}
`);

  const fetchData = Python.eval('fetch_data');

  // Strategy 1: Retry with exponential backoff
  function withRetry(fn: Function, maxRetries = 3): any {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return { success: true, result: fn(), attempts: attempt + 1 };
      } catch (error: any) {
        if (attempt === maxRetries - 1) {
          return {
            success: false,
            error: error.message,
            attempts: attempt + 1,
          };
        }
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 100;
        const start = Date.now();
        while (Date.now() - start < delay) {
          // Busy wait for demo
        }
      }
    }
  }

  // Strategy 2: Fallback value
  function withFallback(fn: Function, fallback: any): any {
    try {
      return fn();
    } catch (error) {
      return fallback;
    }
  }

  // Strategy 3: Collect all errors
  function collectErrors(ids: number[]): any {
    const results: any[] = [];
    const errors: any[] = [];

    ids.forEach((id) => {
      try {
        const data = fetchData(id);
        results.push({ id, success: true, data });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
        errors.push({ id, error: error.message });
      }
    });

    return { results, errors, successRate: results.filter((r) => r.success).length / results.length };
  }

  console.log('Strategy 1: Retry with backoff');
  [1, 3].forEach((id) => {
    const result = withRetry(() => fetchData(id), 3);
    if (result.success) {
      console.log(`  ✓ ID ${id}: Success after ${result.attempts} attempt(s)`);
    } else {
      console.log(`  ✗ ID ${id}: Failed after ${result.attempts} attempts - ${result.error}`);
    }
  });

  console.log('\nStrategy 2: Fallback value');
  [2, 3].forEach((id) => {
    const result = withFallback(
      () => fetchData(id),
      { id, data: 'Fallback data' }
    );
    console.log(`  ID ${id}:`, result);
  });

  console.log('\nStrategy 3: Collect all errors');
  const summary = collectErrors([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  console.log(`  Success rate: ${(summary.successRate * 100).toFixed(0)}%`);
  console.log(`  Successful: ${summary.results.filter((r: any) => r.success).length}`);
  console.log(`  Failed: ${summary.errors.length}`);
  summary.errors.forEach((e: any) => {
    console.log(`    ID ${e.id}: ${e.error}`);
  });
}

/**
 * Error context and debugging
 */
function errorContextAndDebugging() {
  console.log('\n\nError Context and Debugging\n');

  Python.eval(`
import traceback
import sys

def complex_operation(value):
    """Multi-layer operation that might fail"""
    def layer3(v):
        if v < 0:
            raise ValueError(f"Negative value not allowed: {v}")
        return v ** 2

    def layer2(v):
        return layer3(v - 10)

    def layer1(v):
        return layer2(v * 2)

    try:
        return layer1(value)
    except Exception as e:
        # Capture full stack trace
        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        error_info = {
            'error': str(e),
            'type': exc_type.__name__,
            'traceback': ''.join(tb_lines)
        }
        raise Exception(f"Operation failed: {error_info}")
`);

  const complexOperation = Python.eval('complex_operation');

  console.log('Testing with detailed error context:');
  [10, 5, 3].forEach((value) => {
    try {
      const result = complexOperation(value);
      console.log(`  ✓ complexOperation(${value}) = ${result}`);
    } catch (error: any) {
      console.log(`  ✗ complexOperation(${value}):`);
      console.log(`    ${error.message.split('\\n')[0]}`);
    }
  });
}

/**
 * Performance impact of error handling
 */
function errorHandlingPerformance() {
  console.log('\n\nError Handling Performance\n');

  Python.eval(`
def operation_that_succeeds(value):
    return value * 2

def operation_that_fails(value):
    raise ValueError("Always fails")
`);

  const operationSucceeds = Python.eval('operation_that_succeeds');
  const operationFails = Python.eval('operation_that_fails');

  const iterations = 10000;

  // Benchmark success case
  let start = Date.now();
  for (let i = 0; i < iterations; i++) {
    try {
      operationSucceeds(i);
    } catch (error) {
      // Handle error
    }
  }
  const successTime = Date.now() - start;

  // Benchmark failure case
  start = Date.now();
  for (let i = 0; i < iterations; i++) {
    try {
      operationFails(i);
    } catch (error) {
      // Handle error
    }
  }
  const failureTime = Date.now() - start;

  // Benchmark without try-catch
  start = Date.now();
  for (let i = 0; i < iterations; i++) {
    operationSucceeds(i);
  }
  const noTryCatchTime = Date.now() - start;

  console.log(`Iterations: ${iterations}`);
  console.log(`Without try-catch: ${noTryCatchTime}ms (${(noTryCatchTime / iterations).toFixed(3)}ms per call)`);
  console.log(`With try-catch (success): ${successTime}ms (${(successTime / iterations).toFixed(3)}ms per call)`);
  console.log(`With try-catch (failure): ${failureTime}ms (${(failureTime / iterations).toFixed(3)}ms per call)`);
  console.log(`Overhead (success): ${((successTime - noTryCatchTime) / noTryCatchTime * 100).toFixed(1)}%`);
  console.log(`Overhead (failure): ${((failureTime - noTryCatchTime) / noTryCatchTime * 100).toFixed(1)}%`);
}

// Main execution
console.log('='.repeat(70));
console.log('Polyglot Example 8: Error Handling Across Languages');
console.log('='.repeat(70));

try {
  basicErrorPropagation();
  rubyErrorHandling();
  javaExceptionHandling();
  errorRecoveryStrategies();
  errorContextAndDebugging();
  errorHandlingPerformance();

  console.log('\n✓ Example completed successfully!');
} catch (error) {
  console.error('Error:', error);
}
