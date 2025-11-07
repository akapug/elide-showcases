/**
 * API Integration Tests
 */

describe('API Integration Tests', () => {
  const baseURL = 'http://localhost:3000';

  describe('POST /api/generate', () => {
    it('should generate code from prompt', async () => {
      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Create a simple function',
          language: 'typescript',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('files');
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('errors');
    });

    it('should support different languages', async () => {
      const languages = ['typescript', 'javascript', 'python', 'ruby'];

      for (const language of languages) {
        const response = await fetch(`${baseURL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'Create a hello world',
            language,
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.files[0].language).toBe(language);
      }
    });
  });

  describe('POST /api/preview', () => {
    it('should generate preview', async () => {
      const response = await fetch(`${baseURL}/api/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'const x = 1;',
          language: 'javascript',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('previewId');
      expect(data).toHaveProperty('bundledCode');
    });
  });

  describe('POST /api/transpile', () => {
    it('should transpile code', async () => {
      const response = await fetch(`${baseURL}/api/transpile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'const x: number = 5;',
          from: 'typescript',
          to: 'javascript',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('code');
      expect(data.code).not.toContain(':');
    });
  });

  describe('POST /api/export', () => {
    it('should export project', async () => {
      const response = await fetch(`${baseURL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: 'test-project',
          files: [
            {
              path: 'index.ts',
              content: 'console.log("hello");',
            },
          ],
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/zip');
    });
  });

  describe('GET /api/templates', () => {
    it('should list templates', async () => {
      const response = await fetch(`${baseURL}/api/templates`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('templates');
      expect(Array.isArray(data.templates)).toBe(true);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${baseURL}/health`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('healthy');
    });
  });
});
