/**
 * OpenAI Client
 *
 * Wrapper for OpenAI API integration
 */

import { logger } from '../utils/logger';

interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export class OpenAIClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  /**
   * Generate code using OpenAI
   */
  async generate(options: GenerateOptions): Promise<string> {
    logger.info(`Calling OpenAI API with model: ${this.model}`);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt },
          ],
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      logger.info(`OpenAI generation completed. Tokens used: ${data.usage?.total_tokens || 'unknown'}`);

      return content;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }
}
