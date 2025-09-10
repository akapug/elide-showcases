# leven

> Measure the difference between two strings using the [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) algorithm

## Install

```sh
npm install leven
```

## Usage

```js
import leven from 'leven';

leven('cat', 'cow');
//=> 2
```

## API

### leven(first, second, options?)

#### first

Type: `string`

First string.

#### second

Type: `string`

Second string.

#### options

Type: `object`

##### maxDistance

Type: `number`

Maximum distance to calculate.

If the actual distance exceeds this value, the function will return `maxDistance` instead of the actual distance. This can significantly improve performance when you only care about matches within a certain threshold.

```js
import leven from 'leven';

leven('abcdef', '123456', {maxDistance: 3});
//=> 3

leven('cat', 'cow', {maxDistance: 5});
//=> 2
```

## Related

- [leven-cli](https://github.com/sindresorhus/leven-cli) - CLI for this module
