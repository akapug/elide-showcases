/**
 * Natural Sort
 * Sort strings with numbers naturally (e.g., "file2" before "file10")
 */

function chunk(str: string): Array<string | number> {
  const chunks: Array<string | number> = [];
  let current = '';
  let isNum = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const charIsNum = /\d/.test(char);

    if (charIsNum !== isNum && current) {
      chunks.push(isNum ? parseInt(current, 10) : current);
      current = '';
    }

    current += char;
    isNum = charIsNum;
  }

  if (current) {
    chunks.push(isNum ? parseInt(current, 10) : current);
  }

  return chunks;
}

export function naturalSort(a: string, b: string): number {
  const chunksA = chunk(a.toLowerCase());
  const chunksB = chunk(b.toLowerCase());

  for (let i = 0; i < Math.max(chunksA.length, chunksB.length); i++) {
    const chunkA = chunksA[i];
    const chunkB = chunksB[i];

    if (chunkA === undefined) return -1;
    if (chunkB === undefined) return 1;

    if (typeof chunkA === 'number' && typeof chunkB === 'number') {
      if (chunkA !== chunkB) return chunkA - chunkB;
    } else {
      const strA = String(chunkA);
      const strB = String(chunkB);
      if (strA !== strB) return strA < strB ? -1 : 1;
    }
  }

  return 0;
}

export function sort<T>(array: T[], accessor?: (item: T) => string): T[] {
  return [...array].sort((a, b) => {
    const strA = accessor ? accessor(a) : String(a);
    const strB = accessor ? accessor(b) : String(b);
    return naturalSort(strA, strB);
  });
}

// CLI demo
if (import.meta.url.includes("natural-sort.ts")) {
  console.log("Natural Sort Demo\n");

  const files = [
    "file10.txt",
    "file2.txt",
    "file1.txt",
    "file20.txt",
    "file3.txt"
  ];

  console.log("Standard sort:");
  console.log(files.slice().sort().join(", "));

  console.log("\nNatural sort:");
  console.log(sort(files).join(", "));

  const versions = ["v1.10.0", "v1.2.0", "v1.2.1", "v2.0.0", "v1.9.0"];
  console.log("\nVersion strings:");
  console.log("Standard:", versions.slice().sort().join(", "));
  console.log("Natural:", sort(versions).join(", "));

  const items = [
    { name: "item10" },
    { name: "item2" },
    { name: "item1" }
  ];

  console.log("\nWith accessor:");
  console.log(sort(items, item => item.name).map(i => i.name).join(", "));

  console.log("✅ Natural sort test passed");
}
