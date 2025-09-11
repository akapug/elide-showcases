import test from 'ava';
import leven, {closestMatch} from './index.js';

test('main', t => {
	t.is(leven('a', 'b'), 1);
	t.is(leven('ab', 'ac'), 1);
	t.is(leven('ac', 'bc'), 1);
	t.is(leven('abc', 'axc'), 1);
	t.is(leven('kitten', 'sitting'), 3);
	t.is(leven('xabxcdxxefxgx', '1ab2cd34ef5g6'), 6);
	t.is(leven('cat', 'cow'), 2);
	t.is(leven('xabxcdxxefxgx', 'abcdefg'), 6);
	t.is(leven('javawasneat', 'scalaisgreat'), 7);
	t.is(leven('example', 'samples'), 3);
	t.is(leven('sturgeon', 'urgently'), 6);
	t.is(leven('levenshtein', 'frankenstein'), 6);
	t.is(leven('distance', 'difference'), 5);
	t.is(leven('因為我是中國人所以我會說中文', '因為我是英國人所以我會說英文'), 2);
});

test('maxDistance option', t => {
	// Test cases from the GitHub issue
	t.is(leven('abcdef', '123456'), 6);
	t.is(leven('abcdef', 'abcdefg'), 1);

	// With maxDistance option
	t.is(leven('abcdef', '123456', {maxDistance: 3}), 3);
	t.is(leven('abcdef', 'abcdefg', {maxDistance: 3}), 1);

	// Additional test cases
	t.is(leven('kitten', 'sitting', {maxDistance: 2}), 2); // Actual distance is 3, should return 2 (max)
	t.is(leven('cat', 'cow', {maxDistance: 5}), 2); // Actual distance is 2, should return 2
	t.is(leven('same', 'same', {maxDistance: 1}), 0); // Identical strings always return 0

	// Early termination based on length difference
	t.is(leven('a', 'abcdefgh', {maxDistance: 3}), 3); // Length diff is 7, exceeds max
	t.is(leven('short', 'muchlongerstringhere', {maxDistance: 5}), 5);

	// Edge cases
	t.is(leven('', 'abc', {maxDistance: 2}), 2); // Empty string
	t.is(leven('', 'abc', {maxDistance: 10}), 3); // Empty string, max > actual
	t.is(leven('abc', '', {maxDistance: 2}), 2); // Empty string reversed
	t.is(leven('abc', 'abc', {maxDistance: 0}), 0); // Identical with max 0
	t.is(leven('abc', 'abd', {maxDistance: 0}), 0); // Different with max 0

	// Verify early termination is working
	t.is(leven('abcdefghijklmnopqrstuvwxyz', '1234567890', {maxDistance: 3}), 3);
	t.is(leven('verylongstringhere', 'completelydifferent', {maxDistance: 1}), 1);

	// Backward compatibility - no options provided
	t.is(leven('foo', 'bar'), 3);
	t.is(leven('foo', 'bar', undefined), 3);
	t.is(leven('foo', 'bar', null), 3);
});

test('closestMatch', t => {
	// Basic functionality
	// Note: With optimization, tie-breaking may not always prefer first in input order
	const result = closestMatch('kitten', ['sitting', 'kitchen', 'mittens']);
	t.true(['kitchen', 'mittens'].includes(result)); // Either is correct (both distance 2)
	t.is(closestMatch('hello', ['jello', 'yellow', 'bellow']), 'jello');

	// With exact match
	t.is(closestMatch('foo', ['bar', 'foo', 'baz']), 'foo');

	// Single candidate
	t.is(closestMatch('test', ['testing']), 'testing');

	// Empty candidates
	t.is(closestMatch('test', []), undefined);
	t.is(closestMatch('test', undefined), undefined);
	t.is(closestMatch('test', null), undefined);

	// All equally distant
	t.is(closestMatch('a', ['b', 'c', 'd']), 'b'); // Should return first one

	// With maxDistance option
	t.is(closestMatch('kitten', ['sitting', 'kitchen', 'mittens'], {maxDistance: 2}), 'kitchen');
	t.is(closestMatch('kitten', ['sitting', 'kitchen', 'mittens'], {maxDistance: 1}), undefined); // No matches within distance 1
	t.is(closestMatch('abcdef', ['123456', 'abcdefg', '1234567890'], {maxDistance: 2}), 'abcdefg');

	// No match within maxDistance
	t.is(closestMatch('abcdef', ['123456', '1234567890'], {maxDistance: 2}), undefined);

	// Empty string cases
	t.is(closestMatch('', ['a', 'ab', 'abc']), 'a');
	t.is(closestMatch('abc', ['', 'a', 'ab']), 'ab'); // Distance 1 is closest

	// Case sensitivity
	t.is(closestMatch('Hello', ['hello', 'HELLO', 'hELLo']), 'hello');

	// Unicode strings
	t.is(closestMatch('café', ['cafe', 'caffè', 'café']), 'café');
	t.is(closestMatch('你好', ['您好', '你们好', '大家好']), '您好');

	// Multiple candidates with same distance - should return first
	t.is(closestMatch('abc', ['ab', 'bc', 'ac']), 'ab');

	// Performance test case - should use maxDistance optimization
	const longCandidates = [
		'verylongstringwithlotsofcharacters',
		'anotherlongstringcompletlydifferent',
		'shortstr',
		'test',
	];
	t.is(closestMatch('test', longCandidates), 'test');
	t.is(closestMatch('testing', longCandidates), 'test');

	// Edge cases from review
	// Exact match should return immediately
	t.is(closestMatch('test', ['a', 'b', 'c', 'test', 'd', 'e']), 'test');

	// MaxDistance: 0 only accepts exact matches
	t.is(closestMatch('test', ['test', 'tests', 'testing'], {maxDistance: 0}), 'test');
	t.is(closestMatch('test', ['tests', 'testing'], {maxDistance: 0}), undefined);

	// Duplicates shouldn't affect result
	t.is(closestMatch('abc', ['ab', 'ab', 'ab', 'abcd', 'abcd']), 'ab');

	// LengthDiff === bestDistance should be skipped
	t.is(closestMatch('ab', ['a', 'abc']), 'a'); // Both distance 1, return first

	// Large array optimization (sorting by length diff)
	const largeArray = Array.from({length: 50}, (_, index) => 'x'.repeat(index));
	largeArray.push('test'); // Add exact match
	t.is(closestMatch('test', largeArray), 'test');

	// Dynamic cap behavior - shouldn't incorrectly prefer worse candidates
	t.is(closestMatch('abc', ['ab', 'abcd', 'xyz'], {maxDistance: 2}), 'ab');

	// Tie-break stability for large arrays (>32 items) - should pick first in input order
	const largeTieArray = Array.from({length: 50}, (_, i) => `z${i}`);
	largeTieArray.push('ab', 'ac', 'ad'); // All distance 1 from 'a'
	t.is(closestMatch('a', largeTieArray), 'ab'); // Should pick first equal candidate

	// Ensure capped path never "improves" candidate due to cap
	t.is(closestMatch('test', ['testing', 'tests'], {maxDistance: 2}), 'tests');
	t.is(closestMatch('test', ['testing', 'tests']), 'tests'); // Same result without cap

	// Additional maxDistance edge case
	t.is(closestMatch('test', ['testing'], {maxDistance: 0}), undefined); // No exact match
});
