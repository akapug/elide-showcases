/**
 * Byte Pair Encoding (BPE) Tokenizer
 *
 * A simplified TypeScript implementation of BPE tokenization, similar to what's used
 * in modern LLMs like GPT. This demonstrates that complex ML preprocessing can be
 * done efficiently in TypeScript without needing Python dependencies.
 *
 * BPE Algorithm:
 * 1. Start with a vocabulary of individual bytes/characters
 * 2. Iteratively merge the most frequent pair of tokens
 * 3. Build a vocabulary of subword units
 * 4. Use this vocabulary to encode/decode text
 */

export interface TokenizerConfig {
    vocabSize: number;
    specialTokens: string[];
}

export interface TokenizerStats {
    totalTokens: number;
    uniqueTokens: number;
    compressionRatio: number;
}

export class BPETokenizer {
    private vocab: Map<number, string>;
    private reverseVocab: Map<string, number>;
    private merges: Map<string, number>;
    private specialTokens: Map<string, number>;
    private config: TokenizerConfig;

    constructor(config?: Partial<TokenizerConfig>) {
        this.config = {
            vocabSize: config?.vocabSize || 5000,
            specialTokens: config?.specialTokens || ['<|endoftext|>', '<|pad|>', '<|unk|>']
        };

        this.vocab = new Map();
        this.reverseVocab = new Map();
        this.merges = new Map();
        this.specialTokens = new Map();

        this.initialize();
    }

    /**
     * Initialize base vocabulary with all bytes and special tokens
     */
    private initialize(): void {
        let idx = 0;

        // Add special tokens first
        for (const token of this.config.specialTokens) {
            this.vocab.set(idx, token);
            this.reverseVocab.set(token, idx);
            this.specialTokens.set(token, idx);
            idx++;
        }

        // Add all possible bytes (0-255)
        for (let i = 0; i < 256; i++) {
            const char = String.fromCharCode(i);
            this.vocab.set(idx, char);
            this.reverseVocab.set(char, idx);
            idx++;
        }

        // Pre-compute some common merges (simplified for demo)
        this.addCommonMerges(idx);
    }

    /**
     * Add common character pair merges to vocabulary
     * In a real implementation, these would be learned from a corpus
     */
    private addCommonMerges(startIdx: number): void {
        const commonPairs = [
            'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd',
            'ti', 'es', 'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar',
            'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 'io', 'le',
            'ing', 'ion', 'the', 'and', 'tion', 'for', 'you', 'that',
            'with', 'not', 'are', 'from', 'was', 'can', 'but', 'have'
        ];

        let idx = startIdx;
        for (const pair of commonPairs) {
            if (idx >= this.config.vocabSize) break;
            this.vocab.set(idx, pair);
            this.reverseVocab.set(pair, idx);
            this.merges.set(pair, idx);
            idx++;
        }
    }

    /**
     * Encode text into token IDs
     */
    public encode(text: string): number[] {
        if (!text) return [];

        // Start with individual characters
        let tokens: string[] = text.split('');

        // Apply merges greedily
        let changed = true;
        while (changed && tokens.length > 1) {
            changed = false;

            for (let i = 0; i < tokens.length - 1; i++) {
                const pair = tokens[i] + tokens[i + 1];

                if (this.merges.has(pair)) {
                    tokens = [
                        ...tokens.slice(0, i),
                        pair,
                        ...tokens.slice(i + 2)
                    ];
                    changed = true;
                    break;
                }
            }
        }

        // Convert tokens to IDs
        return tokens.map(token => {
            if (this.reverseVocab.has(token)) {
                return this.reverseVocab.get(token)!;
            }
            // Return <|unk|> token for unknown
            return this.specialTokens.get('<|unk|>')!;
        });
    }

    /**
     * Decode token IDs back to text
     */
    public decode(tokenIds: number[]): string {
        return tokenIds
            .map(id => this.vocab.get(id) || '<|unk|>')
            .filter(token => !this.config.specialTokens.includes(token))
            .join('');
    }

    /**
     * Encode text and return detailed token information
     */
    public encodeWithInfo(text: string): { tokens: number[], text: string, count: number } {
        const tokens = this.encode(text);
        return {
            tokens,
            text,
            count: tokens.length
        };
    }

    /**
     * Get statistics about tokenization
     */
    public getStats(text: string): TokenizerStats {
        const tokens = this.encode(text);
        const uniqueTokens = new Set(tokens).size;
        const compressionRatio = text.length / tokens.length;

        return {
            totalTokens: tokens.length,
            uniqueTokens,
            compressionRatio
        };
    }

    /**
     * Count tokens in text (efficient version)
     */
    public countTokens(text: string): number {
        return this.encode(text).length;
    }

    /**
     * Get token at specific position
     */
    public getToken(id: number): string | undefined {
        return this.vocab.get(id);
    }

    /**
     * Get token ID for a string
     */
    public getTokenId(token: string): number | undefined {
        return this.reverseVocab.get(token);
    }

    /**
     * Get vocabulary size
     */
    public getVocabSize(): number {
        return this.vocab.size;
    }

    /**
     * Check if token exists in vocabulary
     */
    public hasToken(token: string): boolean {
        return this.reverseVocab.has(token);
    }

    /**
     * Batch encode multiple texts
     */
    public batchEncode(texts: string[]): number[][] {
        return texts.map(text => this.encode(text));
    }

    /**
     * Batch decode multiple token sequences
     */
    public batchDecode(tokenSequences: number[][]): string[] {
        return tokenSequences.map(tokens => this.decode(tokens));
    }

    /**
     * Truncate tokens to max length
     */
    public truncate(tokens: number[], maxLength: number): number[] {
        return tokens.slice(0, maxLength);
    }

    /**
     * Pad tokens to specific length
     */
    public pad(tokens: number[], length: number, padToken?: number): number[] {
        const padId = padToken ?? this.specialTokens.get('<|pad|>')!;
        const padded = [...tokens];

        while (padded.length < length) {
            padded.push(padId);
        }

        return padded.slice(0, length);
    }

    /**
     * Get vocabulary as array of [id, token] pairs
     */
    public getVocabulary(): [number, string][] {
        return Array.from(this.vocab.entries()).sort((a, b) => a[0] - b[0]);
    }

    /**
     * Export tokenizer config
     */
    public exportConfig(): TokenizerConfig & { vocab: [number, string][], merges: [string, number][] } {
        return {
            ...this.config,
            vocab: this.getVocabulary(),
            merges: Array.from(this.merges.entries())
        };
    }

    /**
     * Calculate token frequency in text
     */
    public getTokenFrequency(text: string): Map<number, number> {
        const tokens = this.encode(text);
        const frequency = new Map<number, number>();

        for (const token of tokens) {
            frequency.set(token, (frequency.get(token) || 0) + 1);
        }

        return frequency;
    }

    /**
     * Get most common tokens in text
     */
    public getMostCommonTokens(text: string, topN: number = 10): [number, string, number][] {
        const frequency = this.getTokenFrequency(text);
        const sorted = Array.from(frequency.entries())
            .map(([id, count]) => [id, this.vocab.get(id) || '<|unk|>', count] as [number, string, number])
            .sort((a, b) => b[2] - a[2]);

        return sorted.slice(0, topN);
    }
}

/**
 * Singleton instance for easy access
 */
let defaultTokenizer: BPETokenizer | null = null;

export function getTokenizer(): BPETokenizer {
    if (!defaultTokenizer) {
        defaultTokenizer = new BPETokenizer();
    }
    return defaultTokenizer;
}

/**
 * Utility function to count tokens
 */
export function countTokens(text: string): number {
    return getTokenizer().countTokens(text);
}

/**
 * Utility function to encode text
 */
export function encode(text: string): number[] {
    return getTokenizer().encode(text);
}

/**
 * Utility function to decode tokens
 */
export function decode(tokens: number[]): string {
    return getTokenizer().decode(tokens);
}
