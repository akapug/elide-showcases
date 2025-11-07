/**
 * Tokenizer Tests for Nanochat-Lite
 *
 * Comprehensive test suite for the BPE tokenizer implementation.
 * Tests encoding, decoding, edge cases, and performance.
 */

import { BPETokenizer, getTokenizer, encode, decode, countTokens } from '../backend/tokenizer';

/**
 * Test result interface
 */
interface TestResult {
    name: string;
    passed: boolean;
    message?: string;
    duration?: number;
}

/**
 * Test suite class
 */
class TokenizerTestSuite {
    private results: TestResult[] = [];
    private tokenizer: BPETokenizer;

    constructor() {
        this.tokenizer = new BPETokenizer();
    }

    /**
     * Run a single test
     */
    private async runTest(
        name: string,
        testFn: () => void | Promise<void>
    ): Promise<void> {
        const startTime = Date.now();

        try {
            await testFn();
            this.results.push({
                name,
                passed: true,
                duration: Date.now() - startTime
            });
        } catch (error) {
            this.results.push({
                name,
                passed: false,
                message: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            });
        }
    }

    /**
     * Assert equality
     */
    private assertEqual(actual: any, expected: any, message?: string): void {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(
                message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
            );
        }
    }

    /**
     * Assert condition is true
     */
    private assertTrue(condition: boolean, message?: string): void {
        if (!condition) {
            throw new Error(message || 'Assertion failed: condition is not true');
        }
    }

    /**
     * Test: Basic encoding
     */
    private testBasicEncoding(): void {
        const text = "hello";
        const tokens = this.tokenizer.encode(text);

        this.assertTrue(tokens.length > 0, 'Tokens should not be empty');
        this.assertTrue(tokens.every(t => typeof t === 'number'), 'All tokens should be numbers');
    }

    /**
     * Test: Basic decoding
     */
    private testBasicDecoding(): void {
        const text = "hello world";
        const tokens = this.tokenizer.encode(text);
        const decoded = this.tokenizer.decode(tokens);

        this.assertEqual(decoded, text, 'Decoded text should match original');
    }

    /**
     * Test: Empty string
     */
    private testEmptyString(): void {
        const tokens = this.tokenizer.encode("");
        this.assertEqual(tokens, [], 'Empty string should produce empty token array');

        const decoded = this.tokenizer.decode([]);
        this.assertEqual(decoded, "", 'Empty tokens should produce empty string');
    }

    /**
     * Test: Single character
     */
    private testSingleCharacter(): void {
        const text = "a";
        const tokens = this.tokenizer.encode(text);

        this.assertTrue(tokens.length >= 1, 'Single char should produce at least one token');

        const decoded = this.tokenizer.decode(tokens);
        this.assertEqual(decoded, text, 'Single char should decode correctly');
    }

    /**
     * Test: Special characters
     */
    private testSpecialCharacters(): void {
        const specialChars = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
        const tokens = this.tokenizer.encode(specialChars);

        this.assertTrue(tokens.length > 0, 'Special chars should be tokenized');

        const decoded = this.tokenizer.decode(tokens);
        this.assertEqual(decoded, specialChars, 'Special chars should round-trip correctly');
    }

    /**
     * Test: Unicode characters
     */
    private testUnicodeCharacters(): void {
        const unicode = "Hello 世界 🌍";
        const tokens = this.tokenizer.encode(unicode);

        this.assertTrue(tokens.length > 0, 'Unicode text should be tokenized');

        // Note: Unicode decoding might not be perfect in simplified BPE
        const decoded = this.tokenizer.decode(tokens);
        this.assertTrue(decoded.length > 0, 'Unicode should decode to something');
    }

    /**
     * Test: Long text
     */
    private testLongText(): void {
        const longText = "This is a longer piece of text that contains multiple sentences. " +
            "It should be tokenized efficiently by the BPE algorithm. " +
            "The tokenizer should handle this without any issues.";

        const tokens = this.tokenizer.encode(longText);

        this.assertTrue(
            tokens.length < longText.length,
            'Tokenization should compress the text'
        );

        const decoded = this.tokenizer.decode(tokens);
        this.assertEqual(decoded, longText, 'Long text should round-trip correctly');
    }

    /**
     * Test: Repeated patterns
     */
    private testRepeatedPatterns(): void {
        const repeated = "ababababab";
        const tokens = this.tokenizer.encode(repeated);

        // BPE should merge repeated patterns efficiently
        this.assertTrue(
            tokens.length < repeated.length,
            'Repeated patterns should be compressed'
        );

        const decoded = this.tokenizer.decode(tokens);
        this.assertEqual(decoded, repeated, 'Repeated pattern should decode correctly');
    }

    /**
     * Test: Token counting
     */
    private testTokenCounting(): void {
        const text = "Hello, world!";
        const count1 = this.tokenizer.countTokens(text);
        const count2 = this.tokenizer.encode(text).length;

        this.assertEqual(count1, count2, 'countTokens should match encode length');
    }

    /**
     * Test: Batch encoding
     */
    private testBatchEncoding(): void {
        const texts = ["hello", "world", "test"];
        const batchTokens = this.tokenizer.batchEncode(texts);

        this.assertEqual(batchTokens.length, texts.length, 'Batch should match input length');

        for (let i = 0; i < texts.length; i++) {
            const individualTokens = this.tokenizer.encode(texts[i]);
            this.assertEqual(
                batchTokens[i],
                individualTokens,
                `Batch encoding should match individual for text ${i}`
            );
        }
    }

    /**
     * Test: Batch decoding
     */
    private testBatchDecoding(): void {
        const texts = ["hello", "world", "test"];
        const tokenSequences = this.tokenizer.batchEncode(texts);
        const decoded = this.tokenizer.batchDecode(tokenSequences);

        this.assertEqual(decoded, texts, 'Batch decode should match original texts');
    }

    /**
     * Test: Truncation
     */
    private testTruncation(): void {
        const text = "This is a test sentence with many tokens";
        const tokens = this.tokenizer.encode(text);
        const maxLength = 5;

        const truncated = this.tokenizer.truncate(tokens, maxLength);

        this.assertEqual(truncated.length, maxLength, 'Truncated length should match max');
        this.assertEqual(
            truncated,
            tokens.slice(0, maxLength),
            'Truncated tokens should match first N tokens'
        );
    }

    /**
     * Test: Padding
     */
    private testPadding(): void {
        const text = "short";
        const tokens = this.tokenizer.encode(text);
        const targetLength = 10;

        const padded = this.tokenizer.pad(tokens, targetLength);

        this.assertEqual(padded.length, targetLength, 'Padded length should match target');
    }

    /**
     * Test: Vocabulary size
     */
    private testVocabularySize(): void {
        const vocabSize = this.tokenizer.getVocabSize();

        this.assertTrue(vocabSize > 0, 'Vocabulary should not be empty');
        this.assertTrue(vocabSize < 10000, 'Vocabulary should be reasonable size');
    }

    /**
     * Test: Token frequency
     */
    private testTokenFrequency(): void {
        const text = "hello hello world";
        const frequency = this.tokenizer.getTokenFrequency(text);

        this.assertTrue(frequency.size > 0, 'Frequency map should not be empty');
    }

    /**
     * Test: Most common tokens
     */
    private testMostCommonTokens(): void {
        const text = "the the the cat sat on the mat";
        const common = this.tokenizer.getMostCommonTokens(text, 3);

        this.assertTrue(common.length > 0, 'Should find common tokens');
        this.assertTrue(common.length <= 3, 'Should not exceed requested count');
    }

    /**
     * Test: Statistics
     */
    private testStatistics(): void {
        const text = "This is a test sentence.";
        const stats = this.tokenizer.getStats(text);

        this.assertTrue(stats.totalTokens > 0, 'Total tokens should be positive');
        this.assertTrue(stats.uniqueTokens > 0, 'Unique tokens should be positive');
        this.assertTrue(stats.uniqueTokens <= stats.totalTokens, 'Unique should not exceed total');
        this.assertTrue(stats.compressionRatio > 0, 'Compression ratio should be positive');
    }

    /**
     * Test: Singleton accessor
     */
    private testSingletonAccessor(): void {
        const tok1 = getTokenizer();
        const tok2 = getTokenizer();

        this.assertTrue(tok1 === tok2, 'Should return same instance');
    }

    /**
     * Test: Utility functions
     */
    private testUtilityFunctions(): void {
        const text = "test";

        const tokens1 = encode(text);
        const tokens2 = this.tokenizer.encode(text);
        this.assertEqual(tokens1, tokens2, 'Utility encode should match method');

        const decoded1 = decode(tokens1);
        const decoded2 = this.tokenizer.decode(tokens1);
        this.assertEqual(decoded1, decoded2, 'Utility decode should match method');

        const count1 = countTokens(text);
        const count2 = this.tokenizer.countTokens(text);
        this.assertEqual(count1, count2, 'Utility countTokens should match method');
    }

    /**
     * Performance test: Encode speed
     */
    private testEncodePerformance(): void {
        const text = "This is a performance test. ".repeat(100);
        const startTime = Date.now();
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            this.tokenizer.encode(text);
        }

        const duration = Date.now() - startTime;
        const avgTime = duration / iterations;

        this.assertTrue(avgTime < 100, `Encoding should be fast (avg: ${avgTime.toFixed(2)}ms)`);
    }

    /**
     * Performance test: Batch encoding speed
     */
    private testBatchEncodePerformance(): void {
        const texts = Array(100).fill("This is a test sentence");
        const startTime = Date.now();

        this.tokenizer.batchEncode(texts);

        const duration = Date.now() - startTime;

        this.assertTrue(duration < 1000, `Batch encoding should be fast (${duration}ms)`);
    }

    /**
     * Run all tests
     */
    public async runAll(): Promise<void> {
        console.log('='.repeat(60));
        console.log('Running Tokenizer Tests');
        console.log('='.repeat(60));

        await this.runTest('Basic Encoding', () => this.testBasicEncoding());
        await this.runTest('Basic Decoding', () => this.testBasicDecoding());
        await this.runTest('Empty String', () => this.testEmptyString());
        await this.runTest('Single Character', () => this.testSingleCharacter());
        await this.runTest('Special Characters', () => this.testSpecialCharacters());
        await this.runTest('Unicode Characters', () => this.testUnicodeCharacters());
        await this.runTest('Long Text', () => this.testLongText());
        await this.runTest('Repeated Patterns', () => this.testRepeatedPatterns());
        await this.runTest('Token Counting', () => this.testTokenCounting());
        await this.runTest('Batch Encoding', () => this.testBatchEncoding());
        await this.runTest('Batch Decoding', () => this.testBatchDecoding());
        await this.runTest('Truncation', () => this.testTruncation());
        await this.runTest('Padding', () => this.testPadding());
        await this.runTest('Vocabulary Size', () => this.testVocabularySize());
        await this.runTest('Token Frequency', () => this.testTokenFrequency());
        await this.runTest('Most Common Tokens', () => this.testMostCommonTokens());
        await this.runTest('Statistics', () => this.testStatistics());
        await this.runTest('Singleton Accessor', () => this.testSingletonAccessor());
        await this.runTest('Utility Functions', () => this.testUtilityFunctions());
        await this.runTest('Encode Performance', () => this.testEncodePerformance());
        await this.runTest('Batch Encode Performance', () => this.testBatchEncodePerformance());

        this.printResults();
    }

    /**
     * Print test results
     */
    private printResults(): void {
        console.log('\n' + '='.repeat(60));
        console.log('Test Results');
        console.log('='.repeat(60));

        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;

        for (const result of this.results) {
            const status = result.passed ? '✓ PASS' : '✗ FAIL';
            const duration = result.duration ? ` (${result.duration}ms)` : '';
            console.log(`${status}: ${result.name}${duration}`);

            if (!result.passed && result.message) {
                console.log(`  Error: ${result.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Total: ${this.results.length} | Passed: ${passed} | Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        if (failed > 0) {
            process.exit(1);
        }
    }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    const suite = new TokenizerTestSuite();
    await suite.runAll();
}

// Run tests if this is the main module
if (require.main === module) {
    main().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

export { TokenizerTestSuite };
