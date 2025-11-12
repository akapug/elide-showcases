/**
 * Example 4: Shared Data Structures Across Languages
 *
 * Demonstrates:
 * - Zero-copy data sharing
 * - Bidirectional object access
 * - Type conversions between languages
 * - Shared mutable state
 *
 * Performance: Zero-copy for compatible types, minimal conversion overhead
 */

const Python = Polyglot.import('python');
const Ruby = Polyglot.import('ruby');
const Java = Polyglot.import('java');

/**
 * Demonstrate zero-copy data sharing
 */
function zeroCopySharing() {
  console.log('Zero-Copy Data Sharing\n');

  // Create a TypeScript object
  const tsObject = {
    name: 'TypeScript Object',
    values: [1, 2, 3, 4, 5],
    nested: {
      key: 'value',
      count: 42,
    },
  };

  console.log('Original TS object:', tsObject);

  // Share with Python (zero-copy reference)
  Python.eval('ts_obj = None');
  const pythonGlobals = Python.eval('globals()');
  pythonGlobals['ts_obj'] = tsObject;

  // Access and modify from Python
  Python.eval(`
ts_obj['modified_by'] = 'Python'
ts_obj['values'].append(6)
ts_obj['nested']['python_key'] = 'added from Python'
`);

  console.log('After Python modification:', tsObject);
  console.log('✓ Changes visible in TypeScript (zero-copy)');

  // Share with Ruby
  Ruby.eval(`
def modify_object(obj)
  obj['modified_by'] = 'Ruby'
  obj['values'] << 7
  obj['nested']['ruby_key'] = 'added from Ruby'
end
`);

  const modifyObject = Ruby.eval('method(:modify_object)');
  modifyObject.call(tsObject);

  console.log('After Ruby modification:', tsObject);
  console.log('✓ Changes visible in TypeScript (zero-copy)');
}

/**
 * Share arrays across languages
 */
function sharedArrays() {
  console.log('\n\nShared Arrays\n');

  // TypeScript array
  const numbers = [1, 2, 3, 4, 5];

  // Process in Python
  const pythonCode = `
import statistics

def array_stats(arr):
    return {
        'mean': statistics.mean(arr),
        'median': statistics.median(arr),
        'stdev': statistics.stdev(arr) if len(arr) > 1 else 0,
        'min': min(arr),
        'max': max(arr)
    }
`;

  Python.eval(pythonCode);
  const arrayStats = Python.eval('array_stats');
  const stats = arrayStats(numbers);

  console.log('Array:', numbers);
  console.log('Python stats:', stats);

  // Process in Ruby
  Ruby.eval(`
def array_operations(arr)
  {
    sum: arr.sum,
    product: arr.reduce(:*),
    even: arr.select(&:even?),
    odd: arr.select(&:odd?),
    reversed: arr.reverse
  }
end
`);

  const arrayOperations = Ruby.eval('method(:array_operations)');
  const operations = arrayOperations.call(numbers);

  console.log('Ruby operations:', operations);
}

/**
 * Complex nested data structures
 */
function complexDataStructures() {
  console.log('\n\nComplex Nested Data Structures\n');

  // Create complex TypeScript data
  const users = [
    {
      id: 1,
      name: 'Alice',
      emails: ['alice@work.com', 'alice@home.com'],
      metadata: {
        joined: '2023-01-15',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      },
    },
    {
      id: 2,
      name: 'Bob',
      emails: ['bob@work.com'],
      metadata: {
        joined: '2023-03-20',
        role: 'user',
        permissions: ['read', 'write'],
      },
    },
  ];

  // Process in Python
  Python.eval(`
def filter_users(users, role):
    return [u for u in users if u['metadata']['role'] == role]

def get_all_permissions(users):
    perms = set()
    for user in users:
        perms.update(user['metadata']['permissions'])
    return list(perms)

def transform_user(user):
    return {
        'id': user['id'],
        'name': user['name'].upper(),
        'email_count': len(user['emails']),
        'is_admin': user['metadata']['role'] == 'admin'
    }
`);

  const filterUsers = Python.eval('filter_users');
  const getAllPermissions = Python.eval('get_all_permissions');
  const transformUser = Python.eval('transform_user');

  console.log('Admins:', filterUsers(users, 'admin'));
  console.log('All permissions:', getAllPermissions(users));
  console.log('Transformed:', users.map((u) => transformUser(u)));
}

/**
 * Sharing Java collections
 */
function javaCollections() {
  console.log('\n\nJava Collections\n');

  // Create Java ArrayList
  const ArrayList = Java.type('java.util.ArrayList');
  const HashMap = Java.type('java.util.HashMap');

  const javaList = new ArrayList();
  javaList.add('Java');
  javaList.add('Python');
  javaList.add('Ruby');
  javaList.add('TypeScript');

  console.log('Java ArrayList size:', javaList.size());

  // Convert to TypeScript array
  const tsArray = [];
  for (let i = 0; i < javaList.size(); i++) {
    tsArray.push(javaList.get(i));
  }
  console.log('Converted to TS array:', tsArray);

  // Create Java HashMap
  const javaMap = new HashMap();
  javaMap.put('name', 'Elide');
  javaMap.put('version', 'beta11');
  javaMap.put('polyglot', true);

  console.log('Java HashMap:', {
    name: javaMap.get('name'),
    version: javaMap.get('version'),
    polyglot: javaMap.get('polyglot'),
  });

  // Pass Java collections to Python
  Python.eval(`
def process_java_list(java_list):
    # Can iterate over Java collections directly
    result = []
    for item in java_list:
        result.append(str(item).upper())
    return result
`);

  const processJavaList = Python.eval('process_java_list');
  const processed = processJavaList(javaList);
  console.log('Python processed Java list:', processed);
}

/**
 * Shared mutable state
 */
function sharedMutableState() {
  console.log('\n\nShared Mutable State\n');

  // Create a shared counter object
  const counter = {
    value: 0,
    history: [] as number[],
  };

  console.log('Initial counter:', counter);

  // Increment from Python
  Python.eval(`
def increment_counter(counter, by=1):
    counter['value'] += by
    counter['history'].append(counter['value'])
`);

  const incrementCounterPy = Python.eval('increment_counter');

  // Increment from Ruby
  Ruby.eval(`
def increment_counter(counter, by = 1)
  counter['value'] += by
  counter['history'] << counter['value']
end
`);

  const incrementCounterRb = Ruby.eval('method(:increment_counter)');

  // Increment from TypeScript
  function incrementCounterTS(counter: any, by = 1) {
    counter.value += by;
    counter.history.push(counter.value);
  }

  // Increment from each language
  incrementCounterTS(counter, 5);
  incrementCounterPy(counter, 3);
  incrementCounterRb.call(counter, 7);
  incrementCounterTS(counter, 2);
  incrementCounterPy(counter, 4);

  console.log('Final counter:', counter);
  console.log('✓ All languages share the same mutable object');
}

/**
 * Performance comparison
 */
function performanceComparison() {
  console.log('\n\nPerformance Comparison\n');

  const dataSize = 10000;
  const data = Array.from({ length: dataSize }, (_, i) => ({
    id: i,
    value: Math.random() * 100,
  }));

  // TypeScript processing
  const tsStart = Date.now();
  const tsResult = data.filter((item) => item.value > 50).length;
  const tsTime = Date.now() - tsStart;

  // Python processing (with data passing)
  Python.eval(`
def filter_data(data):
    return len([item for item in data if item['value'] > 50])
`);

  const filterData = Python.eval('filter_data');
  const pyStart = Date.now();
  const pyResult = filterData(data);
  const pyTime = Date.now() - pyStart;

  // Ruby processing (with data passing)
  Ruby.eval(`
def filter_data(data)
  data.select { |item| item['value'] > 50 }.length
end
`);

  const filterDataRb = Ruby.eval('method(:filter_data)');
  const rbStart = Date.now();
  const rbResult = filterDataRb.call(data);
  const rbTime = Date.now() - rbStart;

  console.log(`Data size: ${dataSize} objects`);
  console.log(`TypeScript: ${tsResult} items in ${tsTime}ms`);
  console.log(`Python: ${pyResult} items in ${pyTime}ms`);
  console.log(`Ruby: ${rbResult} items in ${rbTime}ms`);
  console.log('\n✓ All languages process the same shared data');
}

// Main execution
console.log('='.repeat(70));
console.log('Polyglot Example 4: Shared Data Structures');
console.log('='.repeat(70));

try {
  zeroCopySharing();
  sharedArrays();
  complexDataStructures();
  javaCollections();
  sharedMutableState();
  performanceComparison();

  console.log('\n✓ Example completed successfully!');
} catch (error) {
  console.error('Error:', error);
}
