/**
 * Anthropic Client
 *
 * Wrapper for Anthropic (Claude) API integration
 */

import { logger } from '../utils/logger';

interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export class AnthropicClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
  }

  /**
   * Generate code using Anthropic Claude
   */
  async generate(options: GenerateOptions): Promise<string> {
    logger.info(`Calling Anthropic API with model: ${this.model}`);

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          system: options.systemPrompt,
          messages: [
            { role: 'user', content: options.userPrompt },
          ],
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text;

      if (!content) {
        throw new Error('No content in Anthropic response');
      }

      logger.info('Anthropic generation completed');

      return content;
    } catch (error) {
      logger.error('Anthropic API error:', error);
      throw error;
    }
  }
}
