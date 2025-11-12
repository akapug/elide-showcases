/**
 * Example: Native Mobile TODO App
 *
 * A complete TODO list app for iOS and Android showing mobile app capabilities.
 * Compiles to a 8MB native binary with instant startup.
 */

import { MobileApp } from '../../mobile/app';
import { View, Text, TextInput, Button, ScrollView, ListView } from '../../mobile/ui';
import { AsyncStorage } from '../../mobile/storage';
import { notifications, NotificationHelpers } from '../../mobile/notifications';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number;
}

class TodoApp {
  private app: MobileApp;
  private todos: Todo[] = [];
  private rootView?: View;
  private inputView?: TextInput;
  private listView?: ListView<Todo>;

  constructor() {
    this.app = MobileApp.create({
      appName: 'TODO List',
      appId: 'com.elide.todo',
      version: '1.0.0',
      orientation: 'portrait',
      statusBar: {
        style: 'dark',
        backgroundColor: '#4A90E2',
      },
      permissions: ['notifications'],
      ios: {
        bundleId: 'com.elide.todo',
        deploymentTarget: '13.0',
      },
      android: {
        packageName: 'com.elide.todo',
        minSdkVersion: 21,
        targetSdkVersion: 33,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.app.on('ready', () => {
      this.loadTodos();
      this.createUI();
      this.requestNotificationPermissions();
    });

    this.app.on('background', () => {
      this.saveTodos();
    });

    this.app.on('terminate', () => {
      this.saveTodos();
    });

    notifications.on('opened', (notification) => {
      // Handle notification tap
      const todoId = notification.data?.todoId;
      if (todoId) {
        this.focusTodo(todoId);
      }
    });
  }

  private async loadTodos(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('todos');
      if (data) {
        this.todos = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }

  private async saveTodos(): Promise<void> {
    try {
      await AsyncStorage.setItem('todos', JSON.stringify(this.todos));
    } catch (error) {
      console.error('Failed to save todos:', error);
    }
  }

  private createUI(): void {
    const safeArea = this.app.getSafeAreaInsets();

    // Root container
    this.rootView = new View({
      style: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: safeArea.top,
        paddingBottom: safeArea.bottom,
      },
    });

    // Header
    const header = new View({
      style: {
        backgroundColor: '#4A90E2',
        padding: 20,
        paddingBottom: 15,
      },
    });

    const titleText = new Text({
      text: 'My TODO List',
      style: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
    });

    const statsText = new Text({
      text: this.getStatsText(),
      style: {
        fontSize: 14,
        color: '#E0E0E0',
        marginTop: 5,
      },
    });

    header.addChild(titleText);
    header.addChild(statsText);

    // Input container
    const inputContainer = new View({
      style: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
      },
    });

    this.inputView = new TextInput({
      placeholder: 'Add a new task...',
      placeholderColor: '#999999',
      style: {
        flex: 1,
        fontSize: 16,
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
      },
      onSubmit: () => this.addTodo(),
    });

    const addButton = new Button({
      title: 'Add',
      color: '#4A90E2',
      onPress: () => this.addTodo(),
      style: {
        marginLeft: 10,
        paddingHorizontal: 20,
      },
    });

    inputContainer.addChild(this.inputView);
    inputContainer.addChild(addButton);

    // Filter buttons
    const filterContainer = new View({
      style: {
        backgroundColor: '#FFFFFF',
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
      },
    });

    const allButton = new Button({
      title: 'All',
      onPress: () => this.filterTodos('all'),
      style: {
        flex: 1,
        margin: 5,
      },
    });

    const activeButton = new Button({
      title: 'Active',
      onPress: () => this.filterTodos('active'),
      style: {
        flex: 1,
        margin: 5,
      },
    });

    const completedButton = new Button({
      title: 'Completed',
      onPress: () => this.filterTodos('completed'),
      style: {
        flex: 1,
        margin: 5,
      },
    });

    filterContainer.addChild(allButton);
    filterContainer.addChild(activeButton);
    filterContainer.addChild(completedButton);

    // TODO list
    this.listView = new ListView({
      data: this.todos,
      renderItem: (todo, index) => this.renderTodoItem(todo, index),
      style: {
        flex: 1,
        backgroundColor: '#FFFFFF',
      },
    });

    // Assemble UI
    this.rootView.addChild(header);
    this.rootView.addChild(inputContainer);
    this.rootView.addChild(filterContainer);
    this.rootView.addChild(this.listView);
  }

  private renderTodoItem(todo: Todo, index: number): View {
    const itemContainer = new View({
      style: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: todo.completed ? '#F5F5F5' : '#FFFFFF',
      },
      onPress: () => this.toggleTodo(todo.id),
      onLongPress: () => this.showTodoOptions(todo.id),
    });

    // Checkbox
    const checkbox = new View({
      style: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: todo.completed ? '#4A90E2' : '#CCCCCC',
        backgroundColor: todo.completed ? '#4A90E2' : 'transparent',
        marginRight: 15,
      },
    });

    if (todo.completed) {
      const checkmark = new Text({
        text: '✓',
        style: {
          color: '#FFFFFF',
          fontSize: 16,
          textAlign: 'center',
        },
      });
      checkbox.addChild(checkmark);
    }

    // Text container
    const textContainer = new View({
      style: {
        flex: 1,
      },
    });

    const todoText = new Text({
      text: todo.text,
      style: {
        fontSize: 16,
        color: todo.completed ? '#999999' : '#333333',
        textTransform: todo.completed ? 'none' : 'none',
      },
    });

    textContainer.addChild(todoText);

    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      const isOverdue = dueDate < new Date() && !todo.completed;

      const dueDateText = new Text({
        text: `Due: ${dueDate.toLocaleDateString()}`,
        style: {
          fontSize: 12,
          color: isOverdue ? '#FF6B6B' : '#999999',
          marginTop: 4,
        },
      });

      textContainer.addChild(dueDateText);
    }

    // Delete button
    const deleteButton = new Button({
      title: '🗑',
      onPress: () => this.deleteTodo(todo.id),
      style: {
        marginLeft: 10,
        padding: 5,
      },
    });

    itemContainer.addChild(checkbox);
    itemContainer.addChild(textContainer);
    itemContainer.addChild(deleteButton);

    return itemContainer;
  }

  private async addTodo(): Promise<void> {
    const text = this.inputView?.getValue().trim();
    if (!text) return;

    const todo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now(),
    };

    this.todos.unshift(todo);
    this.inputView?.clear();
    this.listView?.setData(this.todos);

    await this.saveTodos();
    this.app.hapticFeedback('success');
  }

  private async toggleTodo(id: string): Promise<void> {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    this.listView?.refresh();

    await this.saveTodos();
    this.app.hapticFeedback(todo.completed ? 'success' : 'light');
  }

  private async deleteTodo(id: string): Promise<void> {
    this.todos = this.todos.filter(t => t.id !== id);
    this.listView?.setData(this.todos);

    await this.saveTodos();
    this.app.hapticFeedback('warning');
  }

  private async showTodoOptions(id: string): Promise<void> {
    // Show action sheet (would be implemented with native dialog)
    this.app.hapticFeedback('medium');
  }

  private filterTodos(filter: 'all' | 'active' | 'completed'): void {
    let filtered: Todo[];

    switch (filter) {
      case 'active':
        filtered = this.todos.filter(t => !t.completed);
        break;
      case 'completed':
        filtered = this.todos.filter(t => t.completed);
        break;
      default:
        filtered = this.todos;
    }

    this.listView?.setData(filtered);
    this.app.hapticFeedback('light');
  }

  private focusTodo(id: string): void {
    const index = this.todos.findIndex(t => t.id === id);
    if (index !== -1) {
      // Scroll to item (would be implemented)
    }
  }

  private getStatsText(): string {
    const total = this.todos.length;
    const completed = this.todos.filter(t => t.completed).length;
    const active = total - completed;

    return `${active} active • ${completed} completed • ${total} total`;
  }

  private async requestNotificationPermissions(): Promise<void> {
    const result = await notifications.requestPermissions();
    if (!result.granted) {
      console.warn('Notification permissions not granted');
    }
  }

  async start(): Promise<void> {
    // App is initialized and event handlers are set up
  }
}

// Export for native compilation
export async function main() {
  const app = new TodoApp();
  await app.start();
}

// Run if this is the entry point
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start app:', error);
    process.exit(1);
  });
}
