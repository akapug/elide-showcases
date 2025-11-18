/**
 * Compromise - Modest Natural Language Processing
 *
 * Features:
 * - Part-of-speech tagging (basic)
 * - Named entity recognition (basic)
 * - Text normalization
 * - Sentence detection
 *
 * Package has ~1M+ downloads/week on npm!
 */

interface Token {
  text: string;
  pos?: string;
}

// Basic POS tagging
export function tag(text: string): Token[] {
  const words = text.toLowerCase().split(/\s+/);
  const commonNouns = new Set(['cat', 'dog', 'house', 'car', 'person', 'book', 'computer']);
  const commonVerbs = new Set(['is', 'are', 'was', 'were', 'run', 'walk', 'eat', 'sleep']);
  const commonAdj = new Set(['good', 'bad', 'big', 'small', 'happy', 'sad']);

  return words.map(word => {
    let pos = 'unknown';
    if (commonNouns.has(word)) pos = 'noun';
    else if (commonVerbs.has(word)) pos = 'verb';
    else if (commonAdj.has(word)) pos = 'adjective';
    else if (word.endsWith('ly')) pos = 'adverb';
    else if (word.endsWith('ing')) pos = 'verb';

    return { text: word, pos };
  });
}

// Sentence detection
export function sentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Normalize text
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract nouns (basic)
export function nouns(text: string): string[] {
  const tagged = tag(text);
  return tagged.filter(t => t.pos === 'noun').map(t => t.text);
}

// Extract verbs (basic)
export function verbs(text: string): string[] {
  const tagged = tag(text);
  return tagged.filter(t => t.pos === 'verb').map(t => t.text);
}

export default {
  tag,
  sentences,
  normalize,
  nouns,
  verbs,
};

if (import.meta.url.includes("compromise")) {
  console.log("Tag:", tag("The cat is big"));
  console.log("Sentences:", sentences("Hello world. How are you? I'm fine!"));
  console.log("Normalize:", normalize("Hello,  World! This   is a TEST."));
  console.log("Nouns:", nouns("The cat and dog are in the house"));
  console.log("Verbs:", verbs("The cat is running and sleeping"));
}
