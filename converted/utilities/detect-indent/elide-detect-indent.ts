/**
 * Detect Indent - Detect indentation style
 *
 * Features:
 * - Detects spaces vs tabs
 * - Detects indent amount
 * - Zero dependencies
 *
 * Package has ~20M+ downloads/week on npm!
 */

interface IndentInfo {
  amount: number;
  type: 'space' | 'tab' | null;
  indent: string;
}

export default function detectIndent(str: string): IndentInfo {
  const lines = str.split(/\n/g);
  const spacesRegex = /^( +)/;
  const tabsRegex = /^(\t+)/;

  const spaces: number[] = [];
  const tabs: number[] = [];

  for (const line of lines) {
    if (!line) continue;

    const spaceMatch = line.match(spacesRegex);
    const tabMatch = line.match(tabsRegex);

    if (spaceMatch) {
      spaces.push(spaceMatch[1].length);
    } else if (tabMatch) {
      tabs.push(tabMatch[1].length);
    }
  }

  if (tabs.length > spaces.length) {
    return {
      amount: 1,
      type: 'tab',
      indent: '\t',
    };
  }

  if (spaces.length === 0) {
    return {
      amount: 0,
      type: null,
      indent: '',
    };
  }

  // Find most common indent
  const indents = spaces.filter((val, idx, arr) => idx === 0 || val > arr[idx - 1]);
  const counts: Record<number, number> = {};

  for (let i = 1; i < indents.length; i++) {
    const diff = indents[i] - indents[i - 1];
    counts[diff] = (counts[diff] || 0) + 1;
  }

  let maxCount = 0;
  let amount = 2; // default

  for (const [diff, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      amount = parseInt(diff);
    }
  }

  return {
    amount,
    type: 'space',
    indent: ' '.repeat(amount),
  };
}

if (import.meta.url.includes("detect-indent")) {
  const code1 = `function test() {
  console.log("hello");
  return true;
}`;

  const code2 = `function test() {
    console.log("hello");
    return true;
}`;

  const code3 = `function test() {
\tconsole.log("hello");
\treturn true;
}`;

  console.log("2 spaces:", detectIndent(code1));
  console.log("4 spaces:", detectIndent(code2));
  console.log("Tabs:", detectIndent(code3));
}
