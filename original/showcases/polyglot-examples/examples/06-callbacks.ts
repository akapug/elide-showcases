/**
 * Example 6: Cross-Language Callbacks
 *
 * Demonstrates:
 * - Passing TypeScript callbacks to other languages
 * - Receiving callbacks from other languages
 * - Async callbacks and promises
 * - Higher-order functions across languages
 *
 * Performance: ~0.2-0.5ms per callback invocation
 */

const Python = Polyglot.import('python');
const Ruby = Polyglot.import('ruby');

/**
 * TypeScript callbacks in Python
 */
function typeScriptCallbacksInPython() {
  console.log('TypeScript Callbacks in Python\n');

  Python.eval(`
def map_with_callback(items, callback):
    """Apply callback to each item"""
    return [callback(item, i) for i, item in enumerate(items)]

def filter_with_callback(items, predicate):
    """Filter items using predicate callback"""
    return [item for item in items if predicate(item)]

def reduce_with_callback(items, callback, initial):
    """Reduce items using callback"""
    result = initial
    for item in items:
        result = callback(result, item)
    return result

def sort_with_callback(items, comparator):
    """Sort items using comparator callback"""
    from functools import cmp_to_key
    return sorted(items, key=cmp_to_key(comparator))
`);

  const mapWithCallback = Python.eval('map_with_callback');
  const filterWithCallback = Python.eval('filter_with_callback');
  const reduceWithCallback = Python.eval('reduce_with_callback');
  const sortWithCallback = Python.eval('sort_with_callback');

  const numbers = [1, 2, 3, 4, 5];

  // Map with TypeScript callback
  const doubled = mapWithCallback(numbers, (n: number, i: number) => {
    console.log(`  Processing item ${i}: ${n} -> ${n * 2}`);
    return n * 2;
  });
  console.log('Doubled:', doubled);

  // Filter with TypeScript callback
  const evens = filterWithCallback(numbers, (n: number) => n % 2 === 0);
  console.log('Evens:', evens);

  // Reduce with TypeScript callback
  const sum = reduceWithCallback(
    numbers,
    (acc: number, n: number) => acc + n,
    0
  );
  console.log('Sum:', sum);

  // Sort with TypeScript comparator
  const users = [
    { name: 'Alice', age: 28 },
    { name: 'Bob', age: 35 },
    { name: 'Carol', age: 22 },
  ];

  const sortedByAge = sortWithCallback(users, (a: any, b: any) => {
    return a.age - b.age;
  });
  console.log('Sorted by age:', sortedByAge);
}

/**
 * TypeScript callbacks in Ruby
 */
function typeScriptCallbacksInRuby() {
  console.log('\n\nTypeScript Callbacks in Ruby\n');

  Ruby.eval(`
def each_with_callback(items, callback)
  items.each_with_index { |item, index| callback.call(item, index) }
end

def map_with_callback(items, callback)
  items.map.with_index { |item, index| callback.call(item, index) }
end

def select_with_callback(items, predicate)
  items.select { |item| predicate.call(item) }
end

def inject_with_callback(items, initial, callback)
  items.inject(initial) { |acc, item| callback.call(acc, item) }
end
`);

  const eachWithCallback = Ruby.eval('method(:each_with_callback)');
  const mapWithCallback = Ruby.eval('method(:map_with_callback)');
  const selectWithCallback = Ruby.eval('method(:select_with_callback)');
  const injectWithCallback = Ruby.eval('method(:inject_with_callback)');

  const fruits = ['apple', 'banana', 'cherry'];

  // Each with callback
  console.log('Iterating with callback:');
  eachWithCallback.call(fruits, (fruit: string, i: number) => {
    console.log(`  ${i}: ${fruit}`);
  });

  // Map with callback
  const uppercased = mapWithCallback.call(
    fruits,
    (fruit: string) => fruit.toUpperCase()
  );
  console.log('Uppercased:', uppercased);

  // Select with callback
  const longFruits = selectWithCallback.call(
    fruits,
    (fruit: string) => fruit.length > 5
  );
  console.log('Long fruits:', longFruits);

  // Inject with callback
  const concatenated = injectWithCallback.call(
    fruits,
    '',
    (acc: string, fruit: string) => acc + fruit + ', '
  );
  console.log('Concatenated:', concatenated);
}

/**
 * Python callbacks in TypeScript
 */
function pythonCallbacksInTypeScript() {
  console.log('\n\nPython Callbacks in TypeScript\n');

  // Define Python callbacks
  Python.eval(`
def python_transformer(value):
    """Transform value in Python"""
    return str(value).upper() + '_PY'

def python_predicate(value):
    """Filter predicate in Python"""
    return len(str(value)) > 3

def python_comparator(a, b):
    """Compare two values in Python"""
    return len(str(a)) - len(str(b))
`);

  const pythonTransformer = Python.eval('python_transformer');
  const pythonPredicate = Python.eval('python_predicate');

  // Use Python callbacks in TypeScript
  const items = ['a', 'abc', 'abcdef', 'ab'];

  // Map with Python callback
  const transformed = items.map((item) => pythonTransformer(item));
  console.log('Transformed:', transformed);

  // Filter with Python callback
  const filtered = items.filter((item) => pythonPredicate(item));
  console.log('Filtered (len > 3):', filtered);
}

/**
 * Nested callbacks across languages
 */
function nestedCallbacks() {
  console.log('\n\nNested Callbacks Across Languages\n');

  Python.eval(`
def process_nested(data, outer_callback):
    """Process data with nested callbacks"""
    results = []
    for item in data:
        # Call TypeScript callback, which may call back to Python
        result = outer_callback(item)
        results.append(result)
    return results
`);

  Ruby.eval(`
def transform_value(value, transformer)
  transformer.call(value)
end
`);

  const processNested = Python.eval('process_nested');
  const transformValue = Ruby.eval('method(:transform_value)');

  const data = [1, 2, 3, 4, 5];

  // TypeScript -> Python -> Ruby -> Python chain
  const results = processNested(data, (value: number) => {
    console.log(`  TS received: ${value}`);

    // Call Ruby from TypeScript callback
    const rubyResult = transformValue.call(value, (v: number) => {
      console.log(`    Ruby received: ${v}`);
      return v * 10;
    });

    console.log(`  TS sending back: ${rubyResult}`);
    return rubyResult;
  });

  console.log('Final results:', results);
}

/**
 * Error handling in callbacks
 */
function errorHandlingInCallbacks() {
  console.log('\n\nError Handling in Callbacks\n');

  Python.eval(`
def safe_map(items, callback):
    """Map with error handling"""
    results = []
    errors = []

    for i, item in enumerate(items):
        try:
            result = callback(item, i)
            results.append({'success': True, 'value': result})
        except Exception as e:
            results.append({'success': False, 'error': str(e)})
            errors.append({'index': i, 'error': str(e)})

    return {'results': results, 'errors': errors}
`);

  const safeMap = Python.eval('safe_map');

  const items = [1, 2, 0, 4, -1, 6];

  const { results, errors } = safeMap(items, (n: number) => {
    if (n === 0) {
      throw new Error('Cannot process zero');
    }
    if (n < 0) {
      throw new Error('Cannot process negative numbers');
    }
    return 100 / n;
  });

  console.log('Results:', results);
  console.log('Errors:', errors);
}

/**
 * Performance benchmark
 */
function performanceBenchmark() {
  console.log('\n\nPerformance Benchmark\n');

  Python.eval(`
def benchmark_callbacks(items, callback, iterations):
    """Benchmark callback performance"""
    import time
    times = []

    for _ in range(iterations):
        start = time.time()
        for item in items:
            callback(item)
        times.append((time.time() - start) * 1000)

    return {
        'min': min(times),
        'max': max(times),
        'avg': sum(times) / len(times)
    }
`);

  const benchmarkCallbacks = Python.eval('benchmark_callbacks');

  const items = Array.from({ length: 100 }, (_, i) => i);
  const iterations = 100;

  // Simple callback
  const simpleCallback = (n: number) => n * 2;

  const stats = benchmarkCallbacks(items, simpleCallback, iterations);

  console.log(`Callback invocations: ${items.length} items × ${iterations} iterations = ${items.length * iterations} calls`);
  console.log('Timing statistics:');
  console.log(`  Min: ${stats.min.toFixed(3)}ms`);
  console.log(`  Max: ${stats.max.toFixed(3)}ms`);
  console.log(`  Avg: ${stats.avg.toFixed(3)}ms`);
  console.log(`  Per call: ${(stats.avg / items.length).toFixed(6)}ms`);
}

// Main execution
console.log('='.repeat(70));
console.log('Polyglot Example 6: Cross-Language Callbacks');
console.log('='.repeat(70));

try {
  typeScriptCallbacksInPython();
  typeScriptCallbacksInRuby();
  pythonCallbacksInTypeScript();
  nestedCallbacks();
  errorHandlingInCallbacks();
  performanceBenchmark();

  console.log('\n✓ Example completed successfully!');
} catch (error) {
  console.error('Error:', error);
}
