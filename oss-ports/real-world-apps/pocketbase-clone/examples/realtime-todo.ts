/**
 * Example: Real-time Todo Application
 * Demonstrates real-time synchronization across multiple clients
 */

import { createServer } from '../src/index.js';

async function setupRealtimeTodo() {
  console.log('Setting up real-time todo application...\n');

  const server = await createServer({
    port: 8092,
    dbPath: './examples/todo-data.db',
    storagePath: './examples/todo-storage',
  });

  const { collections, hooks } = server;

  try {
    // Create users collection
    console.log('Creating users collection...');
    await collections.createCollection({
      name: 'users',
      type: 'auth',
      options: {
        allowEmailAuth: true,
        allowUsernameAuth: true,
        minPasswordLength: 6,
      },
      schema: [
        {
          id: 'name',
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          id: 'avatar',
          name: 'avatar',
          type: 'file',
          options: {
            maxSize: 2097152, // 2MB
            mimeTypes: ['image/*'],
            thumbs: ['50x50', '100x100'],
          },
        },
        {
          id: 'preferences',
          name: 'preferences',
          type: 'json',
        },
      ],
    });

    // Create lists collection
    console.log('Creating lists collection...');
    await collections.createCollection({
      name: 'lists',
      type: 'base',
      schema: [
        {
          id: 'name',
          name: 'name',
          type: 'text',
          required: true,
          options: { min: 1, max: 100 },
        },
        {
          id: 'description',
          name: 'description',
          type: 'text',
        },
        {
          id: 'owner',
          name: 'owner',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
        {
          id: 'collaborators',
          name: 'collaborators',
          type: 'relation',
          options: {
            collectionId: 'users',
            maxSelect: 10,
          },
        },
        {
          id: 'color',
          name: 'color',
          type: 'select',
          options: {
            values: ['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange'],
            maxSelect: 1,
          },
        },
        {
          id: 'icon',
          name: 'icon',
          type: 'text',
        },
        {
          id: 'archived',
          name: 'archived',
          type: 'bool',
        },
      ],
      indexes: ['owner'],
      listRule: 'owner = auth.id || collaborators ?~ auth.id',
      viewRule: 'owner = auth.id || collaborators ?~ auth.id',
      createRule: 'auth.id != null && owner = auth.id',
      updateRule: 'owner = auth.id',
      deleteRule: 'owner = auth.id',
    });

    // Create todos collection
    console.log('Creating todos collection...');
    await collections.createCollection({
      name: 'todos',
      type: 'base',
      schema: [
        {
          id: 'list',
          name: 'list',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'lists',
            maxSelect: 1,
            cascadeDelete: true,
          },
        },
        {
          id: 'title',
          name: 'title',
          type: 'text',
          required: true,
          options: { min: 1, max: 500 },
        },
        {
          id: 'description',
          name: 'description',
          type: 'text',
        },
        {
          id: 'completed',
          name: 'completed',
          type: 'bool',
        },
        {
          id: 'completedAt',
          name: 'completedAt',
          type: 'date',
        },
        {
          id: 'completedBy',
          name: 'completedBy',
          type: 'relation',
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
        {
          id: 'dueDate',
          name: 'dueDate',
          type: 'date',
        },
        {
          id: 'priority',
          name: 'priority',
          type: 'select',
          options: {
            values: ['low', 'medium', 'high', 'urgent'],
            maxSelect: 1,
          },
        },
        {
          id: 'assignedTo',
          name: 'assignedTo',
          type: 'relation',
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
        {
          id: 'tags',
          name: 'tags',
          type: 'select',
          options: {
            values: ['work', 'personal', 'urgent', 'shopping', 'health', 'family'],
            maxSelect: 5,
          },
        },
        {
          id: 'position',
          name: 'position',
          type: 'number',
          options: { onlyInt: true },
        },
        {
          id: 'subtasks',
          name: 'subtasks',
          type: 'json',
        },
        {
          id: 'attachments',
          name: 'attachments',
          type: 'file',
          options: {
            maxSelect: 5,
            maxSize: 10485760, // 10MB
          },
        },
      ],
      indexes: ['list', 'completed', 'dueDate', 'assignedTo'],
      listRule: '',
      viewRule: '',
      createRule: 'auth.id != null',
      updateRule: '',
      deleteRule: '',
    });

    // Create comments collection
    console.log('Creating comments collection...');
    await collections.createCollection({
      name: 'comments',
      type: 'base',
      schema: [
        {
          id: 'todo',
          name: 'todo',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'todos',
            maxSelect: 1,
            cascadeDelete: true,
          },
        },
        {
          id: 'author',
          name: 'author',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
        {
          id: 'content',
          name: 'content',
          type: 'text',
          required: true,
          options: { min: 1, max: 1000 },
        },
        {
          id: 'mentions',
          name: 'mentions',
          type: 'relation',
          options: {
            collectionId: 'users',
            maxSelect: 10,
          },
        },
      ],
      indexes: ['todo', 'author'],
      listRule: '',
      viewRule: '',
      createRule: 'auth.id != null && author = auth.id',
      updateRule: 'author = auth.id',
      deleteRule: 'author = auth.id',
    });

    // Create activity log collection
    console.log('Creating activity log collection...');
    await collections.createCollection({
      name: 'activity_log',
      type: 'base',
      schema: [
        {
          id: 'user',
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
        {
          id: 'action',
          name: 'action',
          type: 'select',
          required: true,
          options: {
            values: [
              'todo.created',
              'todo.updated',
              'todo.completed',
              'todo.deleted',
              'list.created',
              'list.updated',
              'list.deleted',
              'comment.created',
              'comment.updated',
              'comment.deleted',
            ],
            maxSelect: 1,
          },
        },
        {
          id: 'entity',
          name: 'entity',
          type: 'text',
          required: true,
        },
        {
          id: 'entityId',
          name: 'entityId',
          type: 'text',
          required: true,
        },
        {
          id: 'data',
          name: 'data',
          type: 'json',
        },
      ],
      indexes: ['user', 'entity', 'entityId', 'created'],
      listRule: '',
      viewRule: '',
      createRule: null, // Only via hooks
    });

    // Set up hooks for activity logging
    console.log('Setting up hooks...');

    // Log todo activities
    hooks.on('after-create', 'todos', async (context) => {
      if (context.auth) {
        // Log activity (in production, you'd use the records API)
        console.log('Activity: todo.created', {
          user: context.auth.id,
          entityId: context.record.id,
        });
      }
    });

    hooks.on('after-update', 'todos', async (context) => {
      if (context.auth && context.data?.completed) {
        console.log('Activity: todo.completed', {
          user: context.auth.id,
          entityId: context.record.id,
        });
      }
    });

    // Auto-set completion timestamp
    hooks.on('before-update', 'todos', async (context) => {
      if (context.data?.completed && !context.record.completed) {
        context.data.completedAt = new Date().toISOString();
        context.data.completedBy = context.auth?.id || null;
      }
      return context;
    });

    // Validate due date
    hooks.on('before-create', 'todos', async (context) => {
      if (context.data?.dueDate) {
        const dueDate = new Date(context.data.dueDate);
        const now = new Date();

        if (dueDate < now) {
          throw new Error('Due date cannot be in the past');
        }
      }
      return context;
    });

    console.log('\n✓ Real-time todo application setup complete!');
    console.log('\nCollections created:');
    console.log('  - users (auth)');
    console.log('  - lists');
    console.log('  - todos');
    console.log('  - comments');
    console.log('  - activity_log');

    console.log('\nFeatures:');
    console.log('  ✓ User authentication');
    console.log('  ✓ Multiple todo lists');
    console.log('  ✓ Todo items with subtasks');
    console.log('  ✓ Comments and mentions');
    console.log('  ✓ Real-time synchronization');
    console.log('  ✓ Activity logging');
    console.log('  ✓ File attachments');
    console.log('  ✓ Collaborative lists');
    console.log('  ✓ Priority and tags');

    console.log('\nClient-side Real-time Example:');
    console.log(`
// Connect to real-time
const eventSource = new EventSource('http://localhost:8092/api/realtime');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.action === 'create' && data.collection === 'todos') {
    console.log('New todo created:', data.record);
    // Update UI with new todo
  }

  if (data.action === 'update' && data.collection === 'todos') {
    console.log('Todo updated:', data.record);
    // Update UI with changed todo
  }

  if (data.action === 'delete' && data.collection === 'todos') {
    console.log('Todo deleted:', data.record.id);
    // Remove todo from UI
  }
};

// Create a todo
await fetch('http://localhost:8092/api/records/todos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TOKEN'
  },
  body: JSON.stringify({
    list: 'LIST_ID',
    title: 'Buy groceries',
    priority: 'medium',
    tags: ['shopping'],
    dueDate: '2024-12-31T00:00:00.000Z'
  })
});
// All connected clients will receive this change in real-time!

// Complete a todo
await fetch('http://localhost:8092/api/records/todos/TODO_ID', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TOKEN'
  },
  body: JSON.stringify({
    completed: true
  })
});
// Real-time update sent to all clients

// Add a comment
await fetch('http://localhost:8092/api/records/comments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TOKEN'
  },
  body: JSON.stringify({
    todo: 'TODO_ID',
    author: 'USER_ID',
    content: 'Don\\'t forget the milk!',
    mentions: ['USER_ID_2']
  })
});
    `);

    console.log('\nAPI Endpoints:');
    console.log('\n1. Register User:');
    console.log('   POST /api/collections/users/auth-with-password');
    console.log('   Body: { email, password, passwordConfirm, name }');

    console.log('\n2. Create List:');
    console.log('   POST /api/records/lists');
    console.log('   Body: { name, owner, color, icon }');

    console.log('\n3. Create Todo:');
    console.log('   POST /api/records/todos');
    console.log('   Body: { list, title, dueDate, priority, tags }');

    console.log('\n4. Get List with Todos:');
    console.log('   GET /api/records/todos?filter=list=\'LIST_ID\'&expand=assignedTo,completedBy');

    console.log('\n5. Update Todo:');
    console.log('   PATCH /api/records/todos/TODO_ID');
    console.log('   Body: { completed: true }');

    console.log('\n6. Add Comment:');
    console.log('   POST /api/records/comments');
    console.log('   Body: { todo, author, content }');

    console.log('\n7. Get Activity Log:');
    console.log('   GET /api/records/activity_log?filter=user=\'USER_ID\'&sort=-created');

    console.log('\nServer running at http://localhost:8092');
    console.log('Open multiple browser tabs to see real-time sync in action!');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('\n✓ Collections already exist, server ready!');
      console.log('Server running at http://localhost:8092');
    } else {
      throw error;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupRealtimeTodo().catch(console.error);
}

export { setupRealtimeTodo };
