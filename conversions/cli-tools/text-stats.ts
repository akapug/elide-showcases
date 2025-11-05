/**
 * Text Statistics Analyzer
 * Analyze text for various metrics
 */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  averageWordLength: number;
  averageSentenceLength: number;
  longestWord: string;
  readingTime: number; // in minutes
}

export function analyzeText(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

  const lines = text.split('\n').length;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  const wordList = text.match(/\b\w+\b/g) || [];
  const averageWordLength = wordList.length > 0
    ? wordList.reduce((sum, word) => sum + word.length, 0) / wordList.length
    : 0;

  const averageSentenceLength = sentences > 0 ? words / sentences : 0;

  const longestWord = wordList.length > 0
    ? wordList.reduce((longest, word) => word.length > longest.length ? word : longest, '')
    : '';

  const readingTime = Math.ceil(words / 200); // 200 words per minute

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    sentences,
    paragraphs,
    averageWordLength,
    averageSentenceLength,
    longestWord,
    readingTime
  };
}

export function wordFrequency(text: string): Map<string, number> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const frequency = new Map<string, number>();

  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  return frequency;
}

export function topWords(text: string, count: number = 10): Array<[string, number]> {
  const frequency = wordFrequency(text);
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
}

export function uniqueWords(text: string): string[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return Array.from(new Set(words)).sort();
}

// CLI demo
if (import.meta.url.includes("text-stats.ts")) {
  const sampleText = `
    The quick brown fox jumps over the lazy dog.
    This is a sample text for testing the text statistics analyzer.

    It has multiple paragraphs and sentences.
    The analyzer will count words, sentences, and more!
  `;

  console.log("Text Statistics Demo");
  console.log("\nSample text:", sampleText.trim());

  const stats = analyzeText(sampleText);
  console.log("\nStatistics:");
  console.log("  Characters:", stats.characters);
  console.log("  Characters (no spaces):", stats.charactersNoSpaces);
  console.log("  Words:", stats.words);
  console.log("  Lines:", stats.lines);
  console.log("  Sentences:", stats.sentences);
  console.log("  Paragraphs:", stats.paragraphs);
  console.log("  Avg word length:", stats.averageWordLength.toFixed(2));
  console.log("  Avg sentence length:", stats.averageSentenceLength.toFixed(2) + " words");
  console.log("  Longest word:", stats.longestWord);
  console.log("  Reading time:", stats.readingTime + " min");

  console.log("\nTop 5 words:");
  topWords(sampleText, 5).forEach(([word, count]) => {
    console.log("  " + word + ": " + count);
  });

  console.log("✅ Text stats test passed");
}
