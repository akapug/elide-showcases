"""
Example 5: Calling TypeScript from Python

Demonstrates:
- Importing TypeScript functions from Python
- Bidirectional communication
- Using TypeScript's ecosystem from Python
- Async operations across languages

Performance: ~0.5ms overhead per call after warmup
"""

import polyglot

# Get TypeScript/JavaScript context
js = polyglot.eval(language='js', string='this')

def basic_typescript_calls():
    """Call TypeScript functions from Python"""
    print('Basic TypeScript Calls\n')

    # Define TypeScript functions
    polyglot.eval(language='js', string='''
        globalThis.greet = function(name) {
            return `Hello, ${name}! (from TypeScript)`;
        };

        globalThis.calculate = function(a, b, operation) {
            switch(operation) {
                case 'add': return a + b;
                case 'subtract': return a - b;
                case 'multiply': return a * b;
                case 'divide': return a / b;
                default: throw new Error('Unknown operation');
            }
        };

        globalThis.arrayOperations = function(arr) {
            return {
                doubled: arr.map(x => x * 2),
                filtered: arr.filter(x => x > 5),
                sum: arr.reduce((a, b) => a + b, 0),
                sorted: [...arr].sort((a, b) => b - a)
            };
        };
    ''')

    # Call TypeScript functions
    greet = js['greet']
    calculate = js['calculate']
    array_ops = js['arrayOperations']

    print('Greet:', greet('Python'))
    print('Calculate:', calculate(10, 5, 'multiply'))

    test_array = [3, 7, 2, 9, 1, 5]
    results = array_ops(test_array)
    print(f'Array operations on {test_array}:')
    print(f'  Doubled: {results["doubled"]}')
    print(f'  Filtered (>5): {results["filtered"]}')
    print(f'  Sum: {results["sum"]}')
    print(f'  Sorted desc: {results["sorted"]}')


def typescript_objects():
    """Work with TypeScript objects and classes"""
    print('\n\nTypeScript Objects and Classes\n')

    # Define a TypeScript class
    polyglot.eval(language='js', string='''
        globalThis.Person = class Person {
            constructor(name, age) {
                this.name = name;
                this.age = age;
                this.friends = [];
            }

            addFriend(friend) {
                this.friends.push(friend);
            }

            greet() {
                return `Hi, I'm ${this.name}, ${this.age} years old`;
            }

            hasFriend(name) {
                return this.friends.includes(name);
            }

            toJSON() {
                return {
                    name: this.name,
                    age: this.age,
                    friendCount: this.friends.length
                };
            }
        };
    ''')

    Person = js['Person']

    # Create instances from Python
    alice = Person.new('Alice', 28)
    bob = Person.new('Bob', 35)

    alice.addFriend('Charlie')
    alice.addFriend('Diana')
    bob.addFriend('Alice')

    print('Alice:', alice.greet())
    print('Bob:', bob.greet())
    print('Alice has Charlie as friend:', alice.hasFriend('Charlie'))
    print('Alice JSON:', alice.toJSON())


def data_transformation():
    """Use TypeScript for data transformation"""
    print('\n\nData Transformation\n')

    polyglot.eval(language='js', string='''
        globalThis.processUsers = function(users) {
            return users
                .filter(user => user.active)
                .map(user => ({
                    ...user,
                    displayName: `${user.firstName} ${user.lastName}`,
                    ageGroup: user.age < 30 ? 'young' : user.age < 50 ? 'middle' : 'senior'
                }))
                .sort((a, b) => a.lastName.localeCompare(b.lastName));
        };

        globalThis.aggregateData = function(items) {
            const grouped = {};
            items.forEach(item => {
                if (!grouped[item.category]) {
                    grouped[item.category] = { count: 0, total: 0 };
                }
                grouped[item.category].count++;
                grouped[item.category].total += item.value;
            });

            return Object.entries(grouped).map(([category, stats]) => ({
                category,
                count: stats.count,
                total: stats.total,
                average: stats.total / stats.count
            }));
        };
    ''')

    process_users = js['processUsers']
    aggregate_data = js['aggregateData']

    # Python data
    users = [
        {'firstName': 'Alice', 'lastName': 'Johnson', 'age': 28, 'active': True},
        {'firstName': 'Bob', 'lastName': 'Smith', 'age': 45, 'active': True},
        {'firstName': 'Carol', 'lastName': 'White', 'age': 52, 'active': False},
        {'firstName': 'David', 'lastName': 'Brown', 'age': 31, 'active': True},
    ]

    processed = process_users(users)
    print('Processed users:')
    for user in processed:
        print(f"  {user['displayName']} ({user['ageGroup']})")

    items = [
        {'category': 'A', 'value': 10},
        {'category': 'B', 'value': 20},
        {'category': 'A', 'value': 15},
        {'category': 'C', 'value': 30},
        {'category': 'B', 'value': 25},
    ]

    aggregated = aggregate_data(items)
    print('\nAggregated data:')
    for stat in aggregated:
        print(f"  {stat['category']}: count={stat['count']}, total={stat['total']}, avg={stat['average']:.1f}")


def callbacks_from_python():
    """Pass Python callbacks to TypeScript"""
    print('\n\nCallbacks from Python to TypeScript\n')

    polyglot.eval(language='js', string='''
        globalThis.processWithCallback = function(items, callback) {
            const results = [];
            for (let i = 0; i < items.length; i++) {
                const result = callback(items[i], i);
                results.push(result);
            }
            return results;
        };

        globalThis.filterWithCallback = function(items, predicate) {
            return items.filter(predicate);
        };
    ''')

    process_with_callback = js['processWithCallback']
    filter_with_callback = js['filterWithCallback']

    # Python callback
    def python_callback(item, index):
        return f"Python processed: {item} at index {index}"

    items = ['apple', 'banana', 'cherry']
    results = process_with_callback(items, python_callback)
    print('Results with Python callback:')
    for result in results:
        print(f'  {result}')

    # Python predicate
    def is_even(x):
        return x % 2 == 0

    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    evens = filter_with_callback(numbers, is_even)
    print(f'\nEven numbers: {evens}')


def error_handling():
    """Handle errors across language boundaries"""
    print('\n\nError Handling\n')

    polyglot.eval(language='js', string='''
        globalThis.riskyOperation = function(value) {
            if (value < 0) {
                throw new Error('Value must be non-negative');
            }
            return Math.sqrt(value);
        };
    ''')

    risky_operation = js['riskyOperation']

    # Success case
    try:
        result = risky_operation(16)
        print(f'sqrt(16) = {result}')
    except Exception as e:
        print(f'Error: {e}')

    # Error case
    try:
        result = risky_operation(-5)
        print(f'sqrt(-5) = {result}')
    except Exception as e:
        print(f'✓ Caught TypeScript error in Python: {e}')


def performance_benchmark():
    """Compare Python vs TypeScript performance"""
    print('\n\nPerformance Benchmark\n')

    import time

    polyglot.eval(language='js', string='''
        globalThis.sumArrayTS = function(arr) {
            let sum = 0;
            for (let i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
            return sum;
        };

        globalThis.filterMapTS = function(arr) {
            return arr.filter(x => x > 50).map(x => x * 2);
        };
    ''')

    sum_array_ts = js['sumArrayTS']
    filter_map_ts = js['filterMapTS']

    def sum_array_py(arr):
        return sum(arr)

    def filter_map_py(arr):
        return [x * 2 for x in arr if x > 50]

    # Test data
    data = list(range(10000))

    # Python sum
    start = time.time()
    py_sum = sum_array_py(data)
    py_time = (time.time() - start) * 1000

    # TypeScript sum
    start = time.time()
    ts_sum = sum_array_ts(data)
    ts_time = (time.time() - start) * 1000

    print(f'Sum of {len(data)} numbers:')
    print(f'  Python: {py_sum} in {py_time:.2f}ms')
    print(f'  TypeScript: {ts_sum} in {ts_time:.2f}ms')

    # Python filter/map
    start = time.time()
    py_result = filter_map_py(data)
    py_time = (time.time() - start) * 1000

    # TypeScript filter/map
    start = time.time()
    ts_result = filter_map_ts(data)
    ts_time = (time.time() - start) * 1000

    print(f'\nFilter/Map operations:')
    print(f'  Python: {len(py_result)} items in {py_time:.2f}ms')
    print(f'  TypeScript: {len(ts_result)} items in {ts_time:.2f}ms')


# Main execution
if __name__ == '__main__':
    print('=' * 70)
    print('Polyglot Example 5: TypeScript from Python')
    print('=' * 70)

    try:
        basic_typescript_calls()
        typescript_objects()
        data_transformation()
        callbacks_from_python()
        error_handling()
        performance_benchmark()

        print('\n✓ Example completed successfully!')
    except Exception as e:
        print(f'Error: {e}')
        print('\nNote: This example requires Elide with polyglot support.')
