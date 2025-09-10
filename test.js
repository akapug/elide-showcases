import test from 'ava';
import leven from './index.js';

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
