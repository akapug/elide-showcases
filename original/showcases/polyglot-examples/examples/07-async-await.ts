/**
 * Example 7: Async/Await Patterns Across Languages
 *
 * Demonstrates:
 * - Async operations across language boundaries
 * - Promise interop
 * - Concurrent execution
 * - Error handling in async code
 *
 * Performance: Async overhead ~1-2ms, mainly from actual async operations
 */

const Python = Polyglot.import('python');

/**
 * Basic async operations
 */
async function basicAsyncOperations() {
  console.log('Basic Async Operations\n');

  // Simulate async operations in TypeScript
  async function fetchDataTS(id: number, delay: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          data: `Data for ID ${id}`,
          timestamp: Date.now(),
        });
      }, delay);
    });
  }

  console.log('Starting async operations...');
  const start = Date.now();

  // Sequential execution
  const result1 = await fetchDataTS(1, 100);
  const result2 = await fetchDataTS(2, 100);
  const result3 = await fetchDataTS(3, 100);

  const sequentialTime = Date.now() - start;
  console.log('Sequential results:', [result1, result2, result3]);
  console.log(`Sequential time: ${sequentialTime}ms`);

  // Parallel execution
  const start2 = Date.now();
  const results = await Promise.all([
    fetchDataTS(4, 100),
    fetchDataTS(5, 100),
    fetchDataTS(6, 100),
  ]);

  const parallelTime = Date.now() - start2;
  console.log('Parallel results:', results);
  console.log(`Parallel time: ${parallelTime}ms`);
  console.log(`Speedup: ${(sequentialTime / parallelTime).toFixed(1)}x`);
}

/**
 * Async operations with Python
 */
async function asyncWithPython() {
  console.log('\n\nAsync Operations with Python\n');

  Python.eval(`
import time
import asyncio

def sync_operation(value, delay_ms):
    """Synchronous operation with delay"""
    time.sleep(delay_ms / 1000)
    return {'value': value * 2, 'processed_by': 'Python'}

async def async_operation(value, delay_ms):
    """Asynchronous operation with delay"""
    await asyncio.sleep(delay_ms / 1000)
    return {'value': value * 3, 'processed_by': 'Python async'}

def process_batch(items):
    """Process multiple items"""
    results = []
    for item in items:
        time.sleep(0.01)  # Simulate work
        results.append(item * 2)
    return results
`);

  const syncOperation = Python.eval('sync_operation');
  const processBatch = Python.eval('process_batch');

  // Call synchronous Python from TypeScript async
  console.log('Calling sync Python operation...');
  const start = Date.now();
  const result = syncOperation(10, 100);
  const duration = Date.now() - start;
  console.log('Result:', result);
  console.log(`Duration: ${duration}ms`);

  // Process batch
  console.log('\nProcessing batch...');
  const items = [1, 2, 3, 4, 5];
  const batchStart = Date.now();
  const batchResults = processBatch(items);
  const batchDuration = Date.now() - batchStart;
  console.log('Batch results:', batchResults);
  console.log(`Batch duration: ${batchDuration}ms`);
}

/**
 * Promise-based patterns
 */
async function promisePatterns() {
  console.log('\n\nPromise-Based Patterns\n');

  // TypeScript promises
  function createPromise(value: number, delay: number): Promise<number> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (value < 0) {
          reject(new Error(`Invalid value: ${value}`));
        } else {
          resolve(value * 2);
        }
      }, delay);
    });
  }

  // Promise.all
  console.log('Promise.all:');
  try {
    const results = await Promise.all([
      createPromise(1, 50),
      createPromise(2, 30),
      createPromise(3, 40),
    ]);
    console.log('  All results:', results);
  } catch (error) {
    console.log('  Error:', error);
  }

  // Promise.race
  console.log('\nPromise.race:');
  const fastest = await Promise.race([
    createPromise(10, 100),
    createPromise(20, 50),
    createPromise(30, 150),
  ]);
  console.log('  Fastest result:', fastest);

  // Promise.allSettled
  console.log('\nPromise.allSettled:');
  const settled = await Promise.allSettled([
    createPromise(5, 50),
    createPromise(-1, 50),
    createPromise(10, 50),
  ]);
  console.log('  All settled:', settled);
}

/**
 * Concurrent data processing
 */
async function concurrentProcessing() {
  console.log('\n\nConcurrent Data Processing\n');

  Python.eval(`
def cpu_intensive_task(n):
    """CPU-intensive task"""
    result = 0
    for i in range(n):
        result += i * i
    return result

def io_simulation(delay_ms):
    """Simulate I/O operation"""
    import time
    time.sleep(delay_ms / 1000)
    return f"I/O completed after {delay_ms}ms"
`);

  const cpuIntensiveTask = Python.eval('cpu_intensive_task');
  const ioSimulation = Python.eval('io_simulation');

  // Process data concurrently
  const tasks = [
    { type: 'cpu', input: 100000 },
    { type: 'io', input: 100 },
    { type: 'cpu', input: 200000 },
    { type: 'io', input: 150 },
    { type: 'cpu', input: 150000 },
  ];

  console.log('Processing tasks concurrently...');
  const start = Date.now();

  const results = await Promise.all(
    tasks.map(async (task, index) => {
      const taskStart = Date.now();

      let result;
      if (task.type === 'cpu') {
        result = cpuIntensiveTask(task.input);
      } else {
        result = ioSimulation(task.input);
      }

      const taskDuration = Date.now() - taskStart;
      return {
        index,
        type: task.type,
        result,
        duration: taskDuration,
      };
    })
  );

  const totalDuration = Date.now() - start;

  console.log('Task results:');
  results.forEach((r) => {
    console.log(`  Task ${r.index} (${r.type}): ${r.duration}ms`);
  });
  console.log(`Total duration: ${totalDuration}ms`);
}

/**
 * Error handling in async operations
 */
async function asyncErrorHandling() {
  console.log('\n\nAsync Error Handling\n');

  Python.eval(`
def risky_operation(value):
    """Operation that might fail"""
    if value < 0:
        raise ValueError("Value cannot be negative")
    if value == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return 100 / value
`);

  const riskyOperation = Python.eval('risky_operation');

  async function safeExecute(value: number): Promise<any> {
    try {
      const result = riskyOperation(value);
      return { success: true, value: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  const values = [10, 5, 0, -5, 2];

  console.log('Executing operations with error handling:');
  const results = await Promise.all(values.map(safeExecute));

  results.forEach((result, index) => {
    if (result.success) {
      console.log(`  ${values[index]}: ✓ ${result.value.toFixed(2)}`);
    } else {
      console.log(`  ${values[index]}: ✗ ${result.error}`);
    }
  });
}

/**
 * Async data pipeline
 */
async function asyncPipeline() {
  console.log('\n\nAsync Data Pipeline\n');

  // Define pipeline stages
  async function stage1(data: any[]): Promise<any[]> {
    console.log('  Stage 1: Fetching data...');
    await new Promise((resolve) => setTimeout(resolve, 50));
    return data.map((item) => ({ ...item, stage1: true }));
  }

  Python.eval(`
def stage2_python(data):
    """Stage 2: Transform data in Python"""
    import time
    time.sleep(0.05)  # Simulate work
    return [
        {**item, 'stage2': True, 'transformed': item.get('value', 0) * 2}
        for item in data
    ]
`);

  const stage2 = Python.eval('stage2_python');

  async function stage3(data: any[]): Promise<any[]> {
    console.log('  Stage 3: Finalizing...');
    await new Promise((resolve) => setTimeout(resolve, 50));
    return data.map((item) => ({ ...item, stage3: true, final: true }));
  }

  // Execute pipeline
  const inputData = [
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ];

  console.log('Executing async pipeline...');
  const start = Date.now();

  let data = inputData;
  data = await stage1(data);
  console.log('  After stage 1:', data.length, 'items');

  data = stage2(data);
  console.log('  After stage 2:', data.length, 'items');

  data = await stage3(data);
  console.log('  After stage 3:', data.length, 'items');

  const duration = Date.now() - start;

  console.log('Pipeline output:', data);
  console.log(`Pipeline duration: ${duration}ms`);
}

/**
 * Performance: Async vs Sync
 */
async function asyncVsSyncPerformance() {
  console.log('\n\nAsync vs Sync Performance\n');

  const iterations = 10;

  // Sync version
  function processSync(items: number[]): number[] {
    return items.map((n) => {
      let result = 0;
      for (let i = 0; i < 10000; i++) {
        result += Math.sqrt(n);
      }
      return result;
    });
  }

  // Async version
  async function processAsync(items: number[]): Promise<number[]> {
    return Promise.all(
      items.map(async (n) => {
        let result = 0;
        for (let i = 0; i < 10000; i++) {
          result += Math.sqrt(n);
        }
        return result;
      })
    );
  }

  const testData = Array.from({ length: iterations }, (_, i) => i + 1);

  // Benchmark sync
  const syncStart = Date.now();
  const syncResults = processSync(testData);
  const syncTime = Date.now() - syncStart;

  // Benchmark async
  const asyncStart = Date.now();
  const asyncResults = await processAsync(testData);
  const asyncTime = Date.now() - asyncStart;

  console.log(`Sync processing: ${syncTime}ms`);
  console.log(`Async processing: ${asyncTime}ms`);
  console.log(`Difference: ${asyncTime - syncTime}ms`);
  console.log(`Overhead: ${(((asyncTime - syncTime) / syncTime) * 100).toFixed(1)}%`);
}

// Main execution
console.log('='.repeat(70));
console.log('Polyglot Example 7: Async/Await Patterns');
console.log('='.repeat(70));

async function main() {
  try {
    await basicAsyncOperations();
    await asyncWithPython();
    await promisePatterns();
    await concurrentProcessing();
    await asyncErrorHandling();
    await asyncPipeline();
    await asyncVsSyncPerformance();

    console.log('\n✓ Example completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
