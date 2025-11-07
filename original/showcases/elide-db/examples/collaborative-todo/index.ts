/**
 * Collaborative Todo App Example
 * Demonstrates real-time collaboration with offline support
 */

import { ElideDB } from '../../client/client-api';
import { Document, TableSchema } from '../../types';

// Todo document interface
interface TodoDocument extends Document {
  title: string;
  completed: boolean;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  createdBy: string;
  tags: string[];
}

// List document interface
interface ListDocument extends Document {
  name: string;
  color: string;
  owner: string;
  members: string[];
}

/**
 * Collaborative Todo Application
 */
class CollaborativeTodoApp {
  private db: ElideDB;
  private currentUser: string;

  constructor(syncUrl?: string) {
    this.currentUser = `user-${Math.random().toString(36).substr(2, 9)}`;

    this.db = new ElideDB({
      name: 'collaborative-todo',
      syncUrl,
      syncInterval: 2000, // Sync every 2 seconds
    });
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    const schemas: TableSchema[] = [
      {
        name: 'lists',
        fields: [
          { name: 'name', type: 'string', required: true },
          { name: 'color', type: 'string', required: true },
          { name: 'owner', type: 'string', required: true },
          { name: 'members', type: 'json', required: true }
        ]
      },
      {
        name: 'todos',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'completed', type: 'boolean', required: true },
          { name: 'assignee', type: 'string' },
          { name: 'priority', type: 'string', required: true },
          { name: 'dueDate', type: 'number' },
          { name: 'createdBy', type: 'string', required: true },
          { name: 'tags', type: 'json', required: true }
        ]
      }
    ];

    await this.db.init(schemas);

    console.log(`Collaborative Todo App initialized for user: ${this.currentUser}`);
  }

  /**
   * Create a new todo list
   */
  async createList(name: string, color: string): Promise<ListDocument> {
    const list = await this.db.insert<ListDocument>('lists', {
      name,
      color,
      owner: this.currentUser,
      members: [this.currentUser]
    });

    console.log(`Created list: ${name}`);
    return list;
  }

  /**
   * Share a list with other users
   */
  async shareList(listId: string, userId: string): Promise<void> {
    const list = await this.db.get<ListDocument>('lists', listId);
    if (!list) throw new Error('List not found');

    if (!list.members.includes(userId)) {
      list.members.push(userId);
      await this.db.update('lists', listId, { members: list.members });
      console.log(`Shared list ${list.name} with ${userId}`);
    }
  }

  /**
   * Create a new todo item
   */
  async createTodo(
    title: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    tags: string[] = []
  ): Promise<TodoDocument> {
    const todo = await this.db.insert<TodoDocument>('todos', {
      title,
      completed: false,
      priority,
      createdBy: this.currentUser,
      tags
    });

    console.log(`Created todo: ${title}`);
    return todo;
  }

  /**
   * Toggle todo completion status
   */
  async toggleTodo(todoId: string): Promise<void> {
    const todo = await this.db.get<TodoDocument>('todos', todoId);
    if (!todo) throw new Error('Todo not found');

    await this.db.update('todos', todoId, {
      completed: !todo.completed
    });

    console.log(`Toggled todo: ${todo.title} -> ${!todo.completed ? 'completed' : 'incomplete'}`);
  }

  /**
   * Assign todo to a user
   */
  async assignTodo(todoId: string, assignee: string): Promise<void> {
    await this.db.update('todos', todoId, { assignee });
    console.log(`Assigned todo ${todoId} to ${assignee}`);
  }

  /**
   * Update todo priority
   */
  async updatePriority(
    todoId: string,
    priority: 'low' | 'medium' | 'high'
  ): Promise<void> {
    await this.db.update('todos', todoId, { priority });
    console.log(`Updated todo ${todoId} priority to ${priority}`);
  }

  /**
   * Add tags to a todo
   */
  async addTags(todoId: string, tags: string[]): Promise<void> {
    const todo = await this.db.get<TodoDocument>('todos', todoId);
    if (!todo) throw new Error('Todo not found');

    const newTags = Array.from(new Set([...todo.tags, ...tags]));
    await this.db.update('todos', todoId, { tags: newTags });

    console.log(`Added tags to todo: ${tags.join(', ')}`);
  }

  /**
   * Get all todos
   */
  async getAllTodos(): Promise<TodoDocument[]> {
    return this.db.table<TodoDocument>('todos')
      .orderByDesc('_timestamp')
      .get();
  }

  /**
   * Get completed todos
   */
  async getCompletedTodos(): Promise<TodoDocument[]> {
    return this.db.table<TodoDocument>('todos')
      .where('completed', true)
      .orderByDesc('_timestamp')
      .get();
  }

  /**
   * Get pending todos
   */
  async getPendingTodos(): Promise<TodoDocument[]> {
    return this.db.table<TodoDocument>('todos')
      .where('completed', false)
      .orderByDesc('priority')
      .get();
  }

  /**
   * Get todos by priority
   */
  async getTodosByPriority(priority: 'low' | 'medium' | 'high'): Promise<TodoDocument[]> {
    return this.db.table<TodoDocument>('todos')
      .where('priority', priority)
      .where('completed', false)
      .get();
  }

  /**
   * Get todos assigned to a user
   */
  async getTodosForUser(userId: string): Promise<TodoDocument[]> {
    return this.db.table<TodoDocument>('todos')
      .where('assignee', userId)
      .where('completed', false)
      .get();
  }

  /**
   * Search todos by title
   */
  async searchTodos(query: string): Promise<TodoDocument[]> {
    return this.db.table<TodoDocument>('todos')
      .whereLike('title', `%${query}%`)
      .get();
  }

  /**
   * Get todos by tag
   */
  async getTodosByTag(tag: string): Promise<TodoDocument[]> {
    const allTodos = await this.getAllTodos();
    return allTodos.filter(todo => todo.tags.includes(tag));
  }

  /**
   * Subscribe to real-time todo updates
   */
  subscribeToTodos(callback: (todos: TodoDocument[]) => void) {
    return this.db.table<TodoDocument>('todos')
      .orderByDesc('_timestamp')
      .subscribe(callback);
  }

  /**
   * Subscribe to pending todos only
   */
  subscribeToPendingTodos(callback: (todos: TodoDocument[]) => void) {
    return this.db.table<TodoDocument>('todos')
      .where('completed', false)
      .orderByDesc('priority')
      .subscribe(callback);
  }

  /**
   * Delete a todo
   */
  async deleteTodo(todoId: string): Promise<void> {
    await this.db.delete('todos', todoId);
    console.log(`Deleted todo ${todoId}`);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    connected: boolean;
    syncing: boolean;
    lastSync: number;
  } {
    const state = this.db.getReplicationState();
    return {
      connected: this.db.isConnected(),
      syncing: this.db.isSyncing(),
      lastSync: state?.lastSyncTime || 0
    };
  }

  /**
   * Force sync
   */
  async forceSync(): Promise<void> {
    console.log('Forcing sync...');
    await this.db.sync();
    console.log('Sync completed');
  }

  /**
   * Close the database
   */
  async close(): Promise<void> {
    await this.db.close();
  }
}

/**
 * Demo usage
 */
async function demo() {
  console.log('=== Collaborative Todo App Demo ===\n');

  // Create two instances simulating two users
  const app1 = new CollaborativeTodoApp('ws://localhost:3000');
  const app2 = new CollaborativeTodoApp('ws://localhost:3000');

  await app1.init();
  await app2.init();

  console.log('\n--- User 1: Creating todos ---');
  const todo1 = await app1.createTodo('Build ElideDB', 'high', ['development', 'database']);
  const todo2 = await app1.createTodo('Write documentation', 'medium', ['documentation']);
  const todo3 = await app1.createTodo('Add tests', 'high', ['testing']);

  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n--- User 2: Viewing synced todos ---');
  const syncedTodos = await app2.getAllTodos();
  console.log(`User 2 sees ${syncedTodos.length} todos from User 1`);
  syncedTodos.forEach(todo => {
    console.log(`  - ${todo.title} [${todo.priority}]`);
  });

  console.log('\n--- User 2: Completing a todo ---');
  await app2.toggleTodo(todo1.id);

  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n--- User 1: Viewing updated todos ---');
  const completed = await app1.getCompletedTodos();
  const pending = await app1.getPendingTodos();
  console.log(`Completed: ${completed.length}, Pending: ${pending.length}`);

  console.log('\n--- Real-time subscription demo ---');
  const subscription = app1.subscribeToPendingTodos((todos) => {
    console.log(`[Real-time update] Pending todos: ${todos.length}`);
    todos.forEach(todo => {
      console.log(`  - ${todo.title} [${todo.priority}]`);
    });
  });

  // User 2 creates a new todo
  console.log('\nUser 2 creating a new todo...');
  await app2.createTodo('Review PRs', 'high', ['review']);

  // Wait for real-time update
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Unsubscribe
  subscription.unsubscribe();

  console.log('\n--- Cleanup ---');
  await app1.close();
  await app2.close();

  console.log('\nDemo completed!');
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { CollaborativeTodoApp, TodoDocument, ListDocument };
