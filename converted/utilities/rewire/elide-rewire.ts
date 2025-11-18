/**
 * rewire - Access private module internals
 *
 * Test private variables and functions in modules.
 * **POLYGLOT SHOWCASE**: Internal testing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/rewire (~2M+ downloads/week)
 *
 * Features:
 * - Access private variables
 * - Mock private functions
 * - Modify module internals
 * - Zero dependencies
 *
 * Use cases:
 * - Testing private functions
 * - Accessing internal state
 * - Module introspection
 *
 * Package has ~2M+ downloads/week on npm!
 */

class RewiredModule<T = any> {
  private internals: Map<string, any> = new Map();
  private module: T;

  constructor(module: T) {
    this.module = module;
  }

  /**
   * Get a private variable
   */
  __get__<K = any>(name: string): K {
    if (this.internals.has(name)) {
      return this.internals.get(name);
    }
    return (this.module as any)[name];
  }

  /**
   * Set a private variable
   */
  __set__(name: string, value: any): void;
  __set__(obj: Record<string, any>): void;
  __set__(nameOrObj: string | Record<string, any>, value?: any): void {
    if (typeof nameOrObj === 'string') {
      this.internals.set(nameOrObj, value);
      if (name in (this.module as any)) {
        (this.module as any)[nameOrObj] = value;
      }
    } else {
      Object.entries(nameOrObj).forEach(([k, v]) => {
        this.__set__(k, v);
      });
    }
  }

  /**
   * Reset a private variable to original
   */
  __reset__(name: string): void {
    this.internals.delete(name);
  }

  /**
   * Get original module
   */
  __module__(): T {
    return this.module;
  }

  /**
   * Call with modified context
   */
  __with__(obj: Record<string, any>): () => void {
    const originalValues = new Map<string, any>();

    // Save originals
    Object.entries(obj).forEach(([k, v]) => {
      if (this.internals.has(k)) {
        originalValues.set(k, this.internals.get(k));
      }
      this.__set__(k, v);
    });

    // Return restore function
    return () => {
      Object.keys(obj).forEach((k) => {
        if (originalValues.has(k)) {
          this.__set__(k, originalValues.get(k));
        } else {
          this.__reset__(k);
        }
      });
    };
  }
}

function rewire<T = any>(modulePath: string): RewiredModule<T> {
  // In real implementation, would load actual module
  const module = {} as T;
  return new RewiredModule(module);
}

export default rewire;
export { RewiredModule };

// CLI Demo
if (import.meta.url.includes('elide-rewire.ts')) {
  console.log('🔧 rewire - Access Module Internals for Elide (POLYGLOT!)\n');

  // Mock module for demonstration
  const mockModule: any = {
    publicFn: () => 'public',
    _privateFn: () => 'private',
    _privateVar: 42,
  };

  console.log('Example 1: Access Private Variables\n');
  const rewired = new RewiredModule(mockModule);
  rewired.__set__('_privateVar', 100);
  console.log('  Private var:', rewired.__get__('_privateVar'));
  console.log('✓ Private variable accessed and modified');

  console.log('\nExample 2: Mock Private Functions\n');
  rewired.__set__('_privateFn', () => 'mocked!');
  const fn = rewired.__get__('_privateFn');
  console.log('  Private function result:', fn());
  console.log('✓ Private function mocked');

  console.log('\nExample 3: Set Multiple Values\n');
  rewired.__set__({
    _privateVar: 200,
    _anotherVar: 'test',
  });
  console.log('  Multiple values:', {
    var1: rewired.__get__('_privateVar'),
    var2: rewired.__get__('_anotherVar'),
  });
  console.log('✓ Multiple values set');

  console.log('\nExample 4: Temporary Override\n');
  const restore = rewired.__with__({ _privateVar: 999 });
  console.log('  Temporary value:', rewired.__get__('_privateVar'));
  restore();
  console.log('  Restored value:', rewired.__get__('_privateVar'));
  console.log('✓ Temporary override works');

  console.log('\n✅ Module introspection complete!');
  console.log('🚀 ~2M+ downloads/week on npm!');
  console.log('💡 Test private code without exposing it!');
}
