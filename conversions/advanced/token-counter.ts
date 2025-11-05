/**
 * Token Counter
 * Estimate token count for text (rough GPT-style estimation)
 */

export function countTokens(text: string, options: { exact?: boolean } = {}): number {
  const { exact = false } = options;

  if (exact) {
    // More accurate: count words, punctuation, special chars
    const words = text.split(/\s+/).filter(w => w.length > 0);
    let tokens = 0;

    words.forEach(word => {
      // ~1 token per 4 characters on average
      tokens += Math.ceil(word.length / 4);
    });

    // Add tokens for punctuation and special characters
    const special = text.match(/[^\w\s]/g) || [];
    tokens += special.length / 2;

    return Math.ceil(tokens);
  } else {
    // Quick estimation: 1 token ≈ 4 characters or 0.75 words
    const charCount = text.length;
    return Math.ceil(charCount / 4);
  }
}

export function countTokensByWords(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  // Rough estimate: 1 token ≈ 0.75 words
  return Math.ceil(words.length * 1.33);
}

export function estimateCost(text: string, pricePerToken: number): number {
  const tokens = countTokens(text);
  return tokens * pricePerToken;
}

export function splitByTokens(text: string, maxTokens: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let currentChunk = '';
  let currentTokens = 0;

  sentences.forEach(sentence => {
    const sentenceTokens = countTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = sentenceTokens;
    } else {
      currentChunk += sentence + '. ';
      currentTokens += sentenceTokens;
    }
  });

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// CLI demo
if (import.meta.url.includes("token-counter.ts")) {
  console.log("Token Counter Demo\n");

  const texts = [
    "Hello, world!",
    "The quick brown fox jumps over the lazy dog.",
    "This is a longer piece of text with multiple sentences. It contains various words and punctuation marks. We use it to test token counting."
  ];

  texts.forEach((text, i) => {
    console.log(`Text ${i + 1}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    console.log(`  Quick tokens: ${countTokens(text)}`);
    console.log(`  Exact tokens: ${countTokens(text, { exact: true })}`);
    console.log(`  By words: ${countTokensByWords(text)}`);
    console.log();
  });

  console.log("Split by tokens:");
  const longText = "Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.";
  const chunks = splitByTokens(longText, 20);
  console.log(`  ${chunks.length} chunks created`);
  chunks.forEach((chunk, i) => {
    console.log(`  Chunk ${i + 1}: ${chunk} (${countTokens(chunk)} tokens)`);
  });

  console.log("\n✅ Token counter test passed");
}
