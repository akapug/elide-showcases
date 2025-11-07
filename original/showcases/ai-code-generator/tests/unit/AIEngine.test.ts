/**
 * AIEngine Unit Tests
 */

import { AIEngine } from '../../backend/ai/AIEngine';

describe('AIEngine', () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
  });

  describe('generateCode', () => {
    it('should generate code from prompt', async () => {
      const result = await engine.generateCode({
        prompt: 'Create a simple function',
        language: 'typescript',
        framework: 'none',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('files');
      expect(result.files).toBeInstanceOf(Array);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle React framework', async () => {
      const result = await engine.generateCode({
        prompt: 'Create a button component',
        language: 'typescript',
        framework: 'react',
      });

      expect(result.code).toContain('React');
      expect(result.files[0].language).toBe('typescript');
    });

    it('should handle Python language', async () => {
      const result = await engine.generateCode({
        prompt: 'Create a class',
        language: 'python',
      });

      expect(result.files[0].path).toMatch(/\.py$/);
    });

    it('should include dependencies', async () => {
      const result = await engine.generateCode({
        prompt: 'Create a React app',
        language: 'typescript',
        framework: 'react',
      });

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies).toHaveProperty('react');
    });

    it('should handle context', async () => {
      const result = await engine.generateCode({
        prompt: 'Add error handling',
        language: 'typescript',
        context: {
          previousCode: 'function test() { return 1; }',
          conversation: [
            { role: 'user', content: 'Create a function' },
            { role: 'assistant', content: 'Created function' },
          ],
        },
      });

      expect(result).toBeDefined();
    });
  });
});
