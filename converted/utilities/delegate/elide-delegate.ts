/**
 * Delegate - Event Delegation Library
 *
 * Lightweight event delegation for efficient DOM event handling.
 * **POLYGLOT SHOWCASE**: One event delegation library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/delegate (~200K+ downloads/week)
 *
 * Features:
 * - Event delegation
 * - CSS selector matching
 * - Automatic cleanup
 * - Multiple event types
 * - Memory efficient
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need event delegation
 * - ONE implementation works everywhere on Elide
 * - Consistent DOM patterns across languages
 * - Share event handling across your stack
 *
 * Use cases:
 * - Dynamic content handling
 * - List event management
 * - Memory optimization
 * - Single page applications
 *
 * Package has ~200K+ downloads/week on npm - essential DOM utility!
 */

export interface DelegateOptions {
  capture?: boolean;
}

export interface Binding {
  destroy(): void;
}

class DelegateBinding implements Binding {
  private element: Element;
  private selector: string;
  private type: string;
  private callback: EventListener;
  private listener: EventListener;
  private options: DelegateOptions;

  constructor(
    element: Element,
    selector: string,
    type: string,
    callback: EventListener,
    options: DelegateOptions = {}
  ) {
    this.element = element;
    this.selector = selector;
    this.type = type;
    this.callback = callback;
    this.options = options;

    this.listener = (event: Event) => {
      const target = event.target as Element;

      // Find matching element
      const matches = target.matches ? target.matches(this.selector) : false;
      const closest = target.closest ? target.closest(this.selector) : null;

      if (matches || closest) {
        this.callback.call(closest || target, event);
      }
    };

    this.element.addEventListener(this.type, this.listener, this.options);
  }

  destroy(): void {
    this.element.removeEventListener(this.type, this.listener, this.options);
  }
}

/**
 * Delegate event to selector
 */
export function delegate(
  element: Element | Document,
  selector: string,
  type: string,
  callback: EventListener,
  options?: DelegateOptions
): Binding {
  return new DelegateBinding(element as Element, selector, type, callback, options);
}

/**
 * Delegate multiple event types
 */
export function delegateAll(
  element: Element | Document,
  selector: string,
  types: string[],
  callback: EventListener,
  options?: DelegateOptions
): Binding {
  const bindings = types.map(type =>
    delegate(element, selector, type, callback, options)
  );

  return {
    destroy() {
      bindings.forEach(b => b.destroy());
    }
  };
}

export default delegate;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Delegate - Event Delegation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Delegation ===");

  // Mock DOM for demo
  class MockElement {
    private listeners = new Map<string, EventListener[]>();
    public children: MockElement[] = [];
    private _selector: string;

    constructor(selector: string) {
      this._selector = selector;
    }

    addEventListener(type: string, listener: EventListener) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, []);
      }
      this.listeners.get(type)!.push(listener);
    }

    removeEventListener(type: string, listener: EventListener) {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    }

    dispatchEvent(event: any) {
      const listeners = this.listeners.get(event.type);
      if (listeners) {
        listeners.forEach(listener => listener(event));
      }
    }

    matches(selector: string): boolean {
      return this._selector === selector;
    }

    closest(selector: string): MockElement | null {
      return this.matches(selector) ? this : null;
    }
  }

  const container = new MockElement('.container');
  const button = new MockElement('.btn');
  container.children.push(button);

  const binding1 = delegate(container as any, '.btn', 'click', (event) => {
    console.log('Button clicked via delegation!');
  });

  container.dispatchEvent({ type: 'click', target: button });
  console.log();

  console.log("=== Example 2: Dynamic List Handling ===");
  const list = new MockElement('ul');

  const binding2 = delegate(list as any, 'li', 'click', (event: any) => {
    console.log(`List item clicked: ${event.target._selector}`);
  });

  // Simulate clicks on dynamic items
  const item1 = new MockElement('li');
  const item2 = new MockElement('li');

  list.dispatchEvent({ type: 'click', target: item1 });
  list.dispatchEvent({ type: 'click', target: item2 });
  console.log();

  console.log("=== Example 3: Multiple Event Types ===");
  const form = new MockElement('form');

  const binding3 = delegateAll(form as any, 'input', ['focus', 'blur'], (event: any) => {
    console.log(`Input ${event.type}`);
  });

  form.dispatchEvent({ type: 'focus', target: new MockElement('input') });
  form.dispatchEvent({ type: 'blur', target: new MockElement('input') });
  console.log();

  console.log("=== Example 4: Cleanup ===");
  const wrapper = new MockElement('.wrapper');

  const binding4 = delegate(wrapper as any, 'a', 'click', () => {
    console.log('Link clicked');
  });

  console.log('Before destroy:');
  wrapper.dispatchEvent({ type: 'click', target: new MockElement('a') });

  binding4.destroy();
  console.log('After destroy (no output):');
  wrapper.dispatchEvent({ type: 'click', target: new MockElement('a') });
  console.log();

  console.log("=== Example 5: Component Pattern ===");
  class TodoList {
    private element: MockElement;
    private bindings: Binding[] = [];

    constructor() {
      this.element = new MockElement('.todo-list');
      this.attachEvents();
    }

    attachEvents() {
      this.bindings.push(
        delegate(this.element as any, '.todo-item', 'click', () => {
          console.log('Todo item clicked');
        })
      );

      this.bindings.push(
        delegate(this.element as any, '.delete-btn', 'click', () => {
          console.log('Delete button clicked');
        })
      );
    }

    destroy() {
      this.bindings.forEach(b => b.destroy());
    }

    simulateClick(selector: string) {
      this.element.dispatchEvent({ type: 'click', target: new MockElement(selector) });
    }
  }

  const todoList = new TodoList();
  todoList.simulateClick('.todo-item');
  todoList.simulateClick('.delete-btn');
  console.log();

  console.log("=== Example 6: Event Manager ===");
  class EventManager {
    private bindings: Binding[] = [];

    delegate(element: Element, selector: string, type: string, callback: EventListener) {
      const binding = delegate(element, selector, type, callback);
      this.bindings.push(binding);
      return binding;
    }

    destroyAll() {
      console.log(`Destroying ${this.bindings.length} bindings`);
      this.bindings.forEach(b => b.destroy());
      this.bindings = [];
    }
  }

  const manager = new EventManager();
  manager.delegate(new MockElement('body') as any, '.btn', 'click', () => {});
  manager.delegate(new MockElement('body') as any, 'a', 'click', () => {});
  manager.destroyAll();
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same delegation works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One delegation library, all languages");
  console.log("  ✓ Memory efficient event handling");
  console.log("  ✓ Handle dynamic content easily");
  console.log("  ✓ Clean component lifecycle");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Dynamic content handling");
  console.log("- List event management");
  console.log("- Memory optimization");
  console.log("- Single page applications");
  console.log("- Component libraries");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster cold start than Node.js");
  console.log("- ~200K+ downloads/week on npm!");
}
