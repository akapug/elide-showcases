/**
 * AI Engine
 *
 * Main AI integration layer that handles code generation
 * Supports multiple AI providers: OpenAI, Anthropic, and Mock
 */

import { OpenAIClient } from './OpenAIClient';
import { AnthropicClient } from './AnthropicClient';
import { MockAI } from './MockAI';
import { PromptBuilder } from './PromptBuilder';
import { logger } from '../utils/logger';

export interface GenerateRequest {
  prompt: string;
  language: string;
  framework?: string;
  context?: {
    previousCode?: string;
    conversation?: any[];
  };
}

export interface GenerateResponse {
  id: string;
  code: string;
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  dependencies?: Record<string, string>;
  explanation: string;
  suggestions?: string[];
}

export class AIEngine {
  private client: OpenAIClient | AnthropicClient | MockAI;
  private promptBuilder: PromptBuilder;
  private provider: string;

  constructor() {
    this.provider = process.env.AI_PROVIDER || 'mock';
    this.promptBuilder = new PromptBuilder();

    // Initialize AI client based on provider
    if (this.provider === 'openai' && process.env.OPENAI_API_KEY) {
      this.client = new OpenAIClient(process.env.OPENAI_API_KEY);
      logger.info('AI Engine initialized with OpenAI');
    } else if (this.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      this.client = new AnthropicClient(process.env.ANTHROPIC_API_KEY);
      logger.info('AI Engine initialized with Anthropic');
    } else {
      this.client = new MockAI();
      logger.info('AI Engine initialized with Mock AI (no API key provided)');
    }
  }

  /**
   * Generate code from natural language prompt
   */
  async generateCode(request: GenerateRequest): Promise<GenerateResponse> {
    logger.info(`Generating code: ${request.prompt.substring(0, 50)}...`);

    try {
      // Build prompt
      const systemPrompt = this.promptBuilder.buildSystemPrompt(request.language, request.framework);
      const userPrompt = this.promptBuilder.buildUserPrompt(request);

      // Generate code using AI
      const aiResponse = await this.client.generate({
        systemPrompt,
        userPrompt,
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      });

      // Parse response
      const parsed = this.parseAIResponse(aiResponse, request.language);

      return {
        id: this.generateId(),
        ...parsed,
      };
    } catch (error) {
      logger.error('AI generation error:', error);
      throw new Error(`Failed to generate code: ${(error as Error).message}`);
    }
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string, language: string): Omit<GenerateResponse, 'id'> {
    // Try to extract code blocks
    const codeBlocks = this.extractCodeBlocks(response);

    if (codeBlocks.length === 0) {
      // No code blocks found, treat entire response as code
      return {
        code: response.trim(),
        files: [{
          path: this.getDefaultFilename(language),
          content: response.trim(),
          language,
        }],
        explanation: 'Generated code',
        suggestions: [],
      };
    }

    // Extract main code and additional files
    const mainFile = codeBlocks[0];
    const additionalFiles = codeBlocks.slice(1);

    // Extract dependencies if present
    const dependencies = this.extractDependencies(response);

    // Extract explanation
    const explanation = this.extractExplanation(response);

    // Extract suggestions
    const suggestions = this.extractSuggestions(response);

    return {
      code: mainFile.content,
      files: [
        {
          path: mainFile.filename || this.getDefaultFilename(language),
          content: mainFile.content,
          language: mainFile.language || language,
        },
        ...additionalFiles.map(file => ({
          path: file.filename || `file${additionalFiles.indexOf(file) + 1}.${this.getExtension(language)}`,
          content: file.content,
          language: file.language || language,
        })),
      ],
      dependencies,
      explanation,
      suggestions,
    };
  }

  /**
   * Extract code blocks from markdown
   */
  private extractCodeBlocks(text: string): Array<{ content: string; language?: string; filename?: string }> {
    const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+?)\s*)?\n([\s\S]*?)```/g;
    const blocks: Array<{ content: string; language?: string; filename?: string }> = [];

    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1],
        filename: match[2],
        content: match[3].trim(),
      });
    }

    return blocks;
  }

  /**
   * Extract dependencies from text
   */
  private extractDependencies(text: string): Record<string, string> {
    const dependencies: Record<string, string> = {};

    // Look for package.json-like structures
    const packageJsonMatch = text.match(/"dependencies":\s*{([^}]+)}/);
    if (packageJsonMatch) {
      const depsText = packageJsonMatch[1];
      const depMatches = depsText.matchAll(/"([^"]+)":\s*"([^"]+)"/g);
      for (const match of depMatches) {
        dependencies[match[1]] = match[2];
      }
    }

    // Look for import statements
    const importMatches = text.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const pkg = match[1];
      if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
        dependencies[pkg] = 'latest';
      }
    }

    return dependencies;
  }

  /**
   * Extract explanation from text
   */
  private extractExplanation(text: string): string {
    // Look for explanation section
    const explanationMatch = text.match(/(?:Explanation|Description|About):\s*(.+?)(?:\n\n|$)/is);
    if (explanationMatch) {
      return explanationMatch[1].trim();
    }

    // Get first paragraph before code
    const firstParagraph = text.split('```')[0].trim();
    if (firstParagraph.length > 0 && firstParagraph.length < 500) {
      return firstParagraph;
    }

    return 'Code generated successfully';
  }

  /**
   * Extract suggestions from text
   */
  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];

    // Look for suggestions section
    const suggestionsMatch = text.match(/(?:Suggestions|Next steps|Improvements):\s*(.+?)(?:\n\n|$)/is);
    if (suggestionsMatch) {
      const suggestionText = suggestionsMatch[1];
      const items = suggestionText.split(/\n[-*]\s+/).filter(s => s.trim().length > 0);
      suggestions.push(...items.map(s => s.trim()));
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Get default filename for language
   */
  private getDefaultFilename(language: string): string {
    const filenameMap: Record<string, string> = {
      typescript: 'index.ts',
      javascript: 'index.js',
      tsx: 'App.tsx',
      jsx: 'App.jsx',
      python: 'main.py',
      ruby: 'main.rb',
      java: 'Main.java',
      html: 'index.html',
      css: 'styles.css',
      vue: 'App.vue',
    };

    return filenameMap[language.toLowerCase()] || 'index.txt';
  }

  /**
   * Get file extension for language
   */
  private getExtension(language: string): string {
    const extMap: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      ruby: 'rb',
      java: 'java',
      html: 'html',
      css: 'css',
      tsx: 'tsx',
      jsx: 'jsx',
      vue: 'vue',
    };

    return extMap[language.toLowerCase()] || 'txt';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
