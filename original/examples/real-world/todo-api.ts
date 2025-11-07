// Showcase #10: Real-World Example - Todo API
// Working TypeScript API with in-memory storage

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

class TodoService {
  private todos: Map<number, Todo> = new Map();
  private nextId = 1;

  create(title: string): Todo {
    const todo: Todo = {
      id: this.nextId++,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.todos.set(todo.id, todo);
    return todo;
  }

  getAll(): Todo[] {
    return Array.from(this.todos.values());
  }

  getById(id: number): Todo | undefined {
    return this.todos.get(id);
  }

  update(id: number, updates: Partial<Omit<Todo, "id">>): Todo | null {
    const todo = this.todos.get(id);
    if (!todo) return null;

    const updated = { ...todo, ...updates };
    this.todos.set(id, updated);
    return updated;
  }

  delete(id: number): boolean {
    return this.todos.delete(id);
  }

  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      completed: all.filter(t => t.completed).length,
      pending: all.filter(t => !t.completed).length,
    };
  }
}

// Demo the API
console.log("📝 Todo API Example\n");

const service = new TodoService();

// Create todos
console.log("Creating todos...");
service.create("Learn Elide");
service.create("Build polyglot app");
service.create("Deploy to production");

// List all
console.log("\nAll todos:");
service.getAll().forEach(todo => {
  console.log(`  [${todo.completed ? "✓" : " "}] ${todo.id}. ${todo.title}`);
});

// Complete one
console.log("\nCompleting todo #1...");
service.update(1, { completed: true });

// Show updated list
console.log("\nUpdated todos:");
service.getAll().forEach(todo => {
  console.log(`  [${todo.completed ? "✓" : " "}] ${todo.id}. ${todo.title}`);
});

// Stats
console.log("\nStatistics:");
const stats = service.getStats();
console.log(`  Total: ${stats.total}`);
console.log(`  Completed: ${stats.completed}`);
console.log(`  Pending: ${stats.pending}`);

console.log("\n✨ This is a real, working TypeScript API:");
console.log("   • Type-safe data models");
console.log("   • CRUD operations");
console.log("   • Business logic");
console.log("   • All running instantly with Elide!");
console.log("\n   In production, add HTTP server + database!");
