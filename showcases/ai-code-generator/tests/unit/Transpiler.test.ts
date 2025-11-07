/**
 * Transpiler Unit Tests
 */

import { Transpiler } from '../../backend/transpiler/Transpiler';

describe('Transpiler', () => {
  let transpiler: Transpiler;

  beforeEach(() => {
    transpiler = new Transpiler();
  });

  describe('TypeScript to JavaScript', () => {
    it('should remove type annotations', async () => {
      const code = 'const x: number = 5;';
      const result = await transpiler.transpile(code, 'typescript', 'javascript');

      expect(result.code).not.toContain(':');
      expect(result.code).toContain('const x');
    });

    it('should remove interfaces', async () => {
      const code = 'interface User { name: string; }';
      const result = await transpiler.transpile(code, 'typescript', 'javascript');

      expect(result.code).not.toContain('interface');
    });

    it('should remove type parameters', async () => {
      const code = 'function test<T>(x: T): T { return x; }';
      const result = await transpiler.transpile(code, 'typescript', 'javascript');

      expect(result.code).not.toContain('<T>');
      expect(result.code).toContain('function test');
    });
  });

  describe('JavaScript to TypeScript', () => {
    it('should add type annotations', async () => {
      const code = 'function test(x) { return x; }';
      const result = await transpiler.transpile(code, 'javascript', 'typescript');

      expect(result.code).toContain(':');
      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('JSX to Vue', () => {
    it('should convert JSX to Vue template', async () => {
      const code = `
        function App() {
          return <div className="app">Hello</div>;
        }
      `;
      const result = await transpiler.transpile(code, 'jsx', 'vue');

      expect(result.code).toContain('<template>');
      expect(result.code).toContain('<script');
      expect(result.code).toContain('class=');
      expect(result.warnings).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported transpilation', async () => {
      await expect(
        transpiler.transpile('code', 'typescript', 'python')
      ).rejects.toThrow('not supported');
    });
  });
});
