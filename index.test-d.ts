import {expectType} from 'tsd';
import type {Options} from './index.js';
import leven from './index.js';

// Basic usage
expectType<number>(leven('kitten', 'sitting'));

// With options
expectType<number>(leven('kitten', 'sitting', {maxDistance: 2}));
expectType<number>(leven('abc', 'def', {maxDistance: 10}));

// Options type
const options: Options = {maxDistance: 5};
expectType<number>(leven('foo', 'bar', options));

// Empty options
expectType<number>(leven('foo', 'bar', {}));

// Undefined options
expectType<number>(leven('foo', 'bar', undefined));
