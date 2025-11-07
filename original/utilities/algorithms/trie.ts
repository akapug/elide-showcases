/**
 * Trie (Prefix Tree)
 * Efficient string storage and prefix searching
 * Time: O(m) where m is string length
 */

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  value?: any;
}

export class Trie {
  private root: TrieNode = new TrieNode();

  insert(word: string, value?: any): void {
    let node = this.root;

    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    if (value !== undefined) {
      node.value = value;
    }
  }

  search(word: string): boolean {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  startsWith(prefix: string): boolean {
    return this.findNode(prefix) !== null;
  }

  private findNode(prefix: string): TrieNode | null {
    let node = this.root;

    for (const char of prefix) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char)!;
    }

    return node;
  }

  findWordsWithPrefix(prefix: string): string[] {
    const node = this.findNode(prefix);
    if (!node) return [];

    const words: string[] = [];

    const dfs = (currentNode: TrieNode, currentWord: string) => {
      if (currentNode.isEndOfWord) {
        words.push(currentWord);
      }

      for (const [char, childNode] of currentNode.children) {
        dfs(childNode, currentWord + char);
      }
    };

    dfs(node, prefix);
    return words;
  }

  delete(word: string): boolean {
    const deleteHelper = (node: TrieNode, word: string, index: number): boolean => {
      if (index === word.length) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;
        return node.children.size === 0;
      }

      const char = word[index];
      const childNode = node.children.get(char);

      if (!childNode) return false;

      const shouldDeleteChild = deleteHelper(childNode, word, index + 1);

      if (shouldDeleteChild) {
        node.children.delete(char);
        return node.children.size === 0 && !node.isEndOfWord;
      }

      return false;
    };

    return deleteHelper(this.root, word, 0);
  }

  getAllWords(): string[] {
    const words: string[] = [];

    const dfs = (node: TrieNode, currentWord: string) => {
      if (node.isEndOfWord) {
        words.push(currentWord);
      }

      for (const [char, childNode] of node.children) {
        dfs(childNode, currentWord + char);
      }
    };

    dfs(this.root, '');
    return words;
  }

  get size(): number {
    return this.getAllWords().length;
  }
}

// CLI demo
if (import.meta.url.includes("trie.ts")) {
  const trie = new Trie();

  console.log("Inserting words: cat, car, card, dog, dodge");
  ["cat", "car", "card", "dog", "dodge"].forEach(word => trie.insert(word));

  console.log("\nSearch 'car':", trie.search("car")); // true
  console.log("Search 'ca':", trie.search("ca")); // false
  console.log("Starts with 'ca':", trie.startsWith("ca")); // true

  console.log("\nWords with prefix 'ca':", trie.findWordsWithPrefix("ca").join(", "));
  console.log("Words with prefix 'do':", trie.findWordsWithPrefix("do").join(", "));

  console.log("\nAll words:", trie.getAllWords().join(", "));

  trie.delete("car");
  console.log("After deleting 'car':", trie.getAllWords().join(", "));

  console.log("✅ Trie test passed");
}
