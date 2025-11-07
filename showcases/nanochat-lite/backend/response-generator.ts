/**
 * Response Generator for Nanochat-Lite
 *
 * Generates contextual responses to user messages. In a production system,
 * this would interface with a real LLM. For this showcase, we provide
 * intelligent mock responses that demonstrate the system architecture.
 */

import { countTokens } from './tokenizer';

export interface GeneratorConfig {
    temperature: number;
    maxTokens: number;
    modelName: string;
}

export interface GeneratedResponse {
    message: string;
    tokens: number;
    processingTime: number;
    metadata: {
        model: string;
        temperature: number;
        finish_reason: string;
    };
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class ResponseGenerator {
    private config: GeneratorConfig;
    private responseTemplates: Map<string, string[]>;
    private patterns: Map<RegExp, string[]>;

    constructor(config?: Partial<GeneratorConfig>) {
        this.config = {
            temperature: config?.temperature ?? 0.7,
            maxTokens: config?.maxTokens ?? 500,
            modelName: config?.modelName ?? 'nanochat-lite-demo'
        };

        this.responseTemplates = new Map();
        this.patterns = new Map();

        this.initializeTemplates();
        this.initializePatterns();
    }

    /**
     * Initialize response templates for common queries
     */
    private initializeTemplates(): void {
        this.responseTemplates.set('greeting', [
            'Hello! How can I help you today?',
            'Hi there! What would you like to know?',
            'Greetings! I\'m here to assist you.',
            'Hey! What can I do for you?'
        ]);

        this.responseTemplates.set('help', [
            'I\'m Nanochat-Lite, a demonstration of Elide\'s polyglot capabilities. I can answer questions about programming, technology, and general topics. What would you like to know?',
            'I\'m here to help! This is a showcase of TypeScript and Python working together in the Elide runtime. Feel free to ask me anything.',
            'This chatbot demonstrates zero-cold-start ML deployment. I can discuss Elide, polyglot programming, web development, and more!'
        ]);

        this.responseTemplates.set('elide', [
            'Elide is a polyglot runtime that combines JavaScript, TypeScript, Python, and other languages in a single process with zero cold start. It\'s perfect for serverless deployments and edge computing!',
            'Elide offers instant startup times and seamless language interop. You can run TypeScript for your web logic and Python for ML inference without container overhead.',
            'The Elide runtime eliminates cold starts entirely - typically 0-5ms vs 2-5 seconds for containerized deployments. This makes it ideal for real-time applications.'
        ]);

        this.responseTemplates.set('tokenizer', [
            'This chat uses a BPE (Byte Pair Encoding) tokenizer implemented in TypeScript. It\'s similar to what GPT models use, breaking text into subword units for efficient processing.',
            'The tokenizer runs entirely in TypeScript on the Elide runtime, demonstrating that complex ML preprocessing doesn\'t require Python dependencies.',
            'BPE tokenization allows us to handle any text efficiently by learning common character sequences. The vocabulary includes individual characters and frequent pairs.'
        ]);

        this.responseTemplates.set('polyglot', [
            'Polyglot programming lets you use the best language for each task. TypeScript excels at web APIs and UI, while Python shines for ML inference and data processing.',
            'In this demo, TypeScript handles the web server and tokenization, while Python could handle the actual model inference - all in one runtime!',
            'The polyglot approach eliminates the need for microservices architecture and network calls between languages, resulting in better performance and simpler deployment.'
        ]);

        this.responseTemplates.set('benchmark', [
            'Elide typically starts in under 5ms, while Docker containers take 2-5 seconds. For serverless functions, this means instant response times!',
            'Cold start benchmarks show Elide is 500-1000x faster than containerized deployments. This is crucial for user-facing applications.',
            'The zero-cold-start advantage means every request is fast, not just the warm ones. This provides consistent user experience.'
        ]);

        this.responseTemplates.set('default', [
            'That\'s an interesting question! In a production system, this would connect to a real language model. For now, I\'m demonstrating the architecture.',
            'Great question! This showcase focuses on the runtime and architecture. The response generation could be enhanced with a real ML model.',
            'I understand what you\'re asking. This demo shows how TypeScript and Python can work together seamlessly in Elide.',
            'Thanks for asking! While my responses are simplified for this demo, the underlying architecture supports full LLM integration.'
        ]);
    }

    /**
     * Initialize pattern-based responses
     */
    private initializePatterns(): void {
        // Greetings
        this.patterns.set(
            /^(hi|hello|hey|greetings|good morning|good afternoon)/i,
            this.responseTemplates.get('greeting')!
        );

        // Help requests
        this.patterns.set(
            /(help|what can you do|how do you work|what are you)/i,
            this.responseTemplates.get('help')!
        );

        // Elide questions
        this.patterns.set(
            /(elide|runtime|cold start|startup time|deployment)/i,
            this.responseTemplates.get('elide')!
        );

        // Tokenizer questions
        this.patterns.set(
            /(token|tokeniz|bpe|encode|decode)/i,
            this.responseTemplates.get('tokenizer')!
        );

        // Polyglot questions
        this.patterns.set(
            /(polyglot|typescript|python|language|interop)/i,
            this.responseTemplates.get('polyglot')!
        );

        // Benchmark questions
        this.patterns.set(
            /(benchmark|performance|speed|fast|latency)/i,
            this.responseTemplates.get('benchmark')!
        );

        // Technical questions
        this.patterns.set(
            /(how does|why|what is|explain|tell me about)/i,
            [
                'Let me explain: This showcase demonstrates how Elide can run both web server code (TypeScript) and ML inference code (Python) in a single runtime without cold starts.',
                'Good question! The key innovation here is eliminating the boundary between languages. TypeScript and Python share memory and can call each other directly.',
                'Here\'s the concept: Traditional architectures require separate containers for different languages. Elide lets them run together, reducing latency and complexity.'
            ]
        );
    }

    /**
     * Generate response to user message
     */
    public async generate(message: string, history: Message[] = []): Promise<GeneratedResponse> {
        const startTime = Date.now();

        // Simulate processing delay (in production, this would be actual model inference)
        await this.simulateProcessing();

        // Select appropriate response
        const responseMessage = this.selectResponse(message, history);

        // Count tokens
        const tokens = countTokens(responseMessage);

        const processingTime = Date.now() - startTime;

        return {
            message: responseMessage,
            tokens,
            processingTime,
            metadata: {
                model: this.config.modelName,
                temperature: this.config.temperature,
                finish_reason: 'stop'
            }
        };
    }

    /**
     * Generate streaming response (for future enhancement)
     */
    public async *generateStream(message: string, history: Message[] = []): AsyncGenerator<string> {
        const response = await this.generate(message, history);
        const words = response.message.split(' ');

        for (const word of words) {
            yield word + ' ';
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    /**
     * Select appropriate response based on message content
     */
    private selectResponse(message: string, history: Message[]): string {
        const lowerMessage = message.toLowerCase();

        // Check patterns
        for (const [pattern, responses] of this.patterns) {
            if (pattern.test(lowerMessage)) {
                return this.pickRandom(responses);
            }
        }

        // Context-aware responses based on history
        if (history.length > 0) {
            const lastUserMessage = history
                .filter(m => m.role === 'user')
                .pop()?.content.toLowerCase() || '';

            // Follow-up questions
            if (lowerMessage.includes('more') || lowerMessage.includes('tell me more')) {
                return 'I\'d be happy to elaborate! This system showcases how TypeScript and Python can work together seamlessly. The BPE tokenizer runs in TypeScript, while the actual ML inference could run in Python - all in the same process with zero latency.';
            }

            if (lowerMessage.includes('example') || lowerMessage.includes('show me')) {
                return 'Here\'s an example: When you send a message, it\'s tokenized by TypeScript (this happens instantly), then could be passed to a Python ML model for inference, and the response is sent back - all in under 100ms with no cold start!';
            }
        }

        // Default response
        return this.pickRandom(this.responseTemplates.get('default')!);
    }

    /**
     * Pick random item from array
     */
    private pickRandom<T>(items: T[]): T {
        const index = Math.floor(Math.random() * items.length);
        return items[index];
    }

    /**
     * Simulate processing delay (realistic timing)
     */
    private async simulateProcessing(): Promise<void> {
        // Simulate realistic model inference time: 50-200ms
        const delay = 50 + Math.random() * 150;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<GeneratorConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    public getConfig(): GeneratorConfig {
        return { ...this.config };
    }

    /**
     * Add custom response pattern
     */
    public addPattern(pattern: RegExp, responses: string[]): void {
        this.patterns.set(pattern, responses);
    }

    /**
     * Remove response pattern
     */
    public removePattern(pattern: RegExp): void {
        this.patterns.delete(pattern);
    }

    /**
     * Get statistics
     */
    public getStats(): {
        templateCount: number;
        patternCount: number;
        modelName: string;
    } {
        return {
            templateCount: this.responseTemplates.size,
            patternCount: this.patterns.size,
            modelName: this.config.modelName
        };
    }
}

/**
 * Singleton instance
 */
let defaultGenerator: ResponseGenerator | null = null;

export function getGenerator(): ResponseGenerator {
    if (!defaultGenerator) {
        defaultGenerator = new ResponseGenerator();
    }
    return defaultGenerator;
}
