/**
 * ElideBase - Todo App Example
 *
 * A complete todo application with:
 * - Task management (create, update, delete, complete)
 * - Projects and lists
 * - Real-time collaboration
 * - Due date reminders (Ruby hook)
 * - Task priority prediction (Python ML hook)
 * - Calendar integration (Java hook)
 */

import { SQLiteDatabase } from '../../database/sqlite';
import { SchemaManager, CollectionSchema } from '../../database/schema';
import { RestAPI } from '../../api/rest-api';
import { RealtimeServer } from '../../api/realtime';
import { UserManager } from '../../auth/users';

// Initialize database
const db = new SQLiteDatabase({ filename: './examples/todo-app/todos.db' });
const schema = new SchemaManager(db);

// Define todo schema
const projectsSchema: CollectionSchema = {
  name: 'projects',
  fields: [
    { name: 'name', type: 'text', options: { required: true } },
    { name: 'description', type: 'text' },
    { name: 'color', type: 'text', options: { default: '#3498db' } },
    { name: 'owner_id', type: 'relation', relation: { collection: 'users' } }
  ]
};

const listsSchema: CollectionSchema = {
  name: 'lists',
  fields: [
    { name: 'name', type: 'text', options: { required: true } },
    { name: 'project_id', type: 'relation', relation: { collection: 'projects' } },
    { name: 'position', type: 'number', options: { default: 0 } }
  ],
  indexes: [['project_id']]
};

const tasksSchema: CollectionSchema = {
  name: 'tasks',
  fields: [
    { name: 'title', type: 'text', options: { required: true } },
    { name: 'description', type: 'text' },
    { name: 'list_id', type: 'relation', relation: { collection: 'lists' } },
    { name: 'assignee_id', type: 'relation', relation: { collection: 'users' } },
    { name: 'completed', type: 'boolean', options: { default: false } },
    { name: 'priority', type: 'text', options: { default: 'medium' } },
    { name: 'due_date', type: 'date' },
    { name: 'position', type: 'number', options: { default: 0 } },
    { name: 'tags', type: 'json' }
  ],
  indexes: [['list_id'], ['assignee_id'], ['completed']],
  hooks: {
    afterCreate: 'python:predict_priority', // ML-based priority prediction
    beforeCreate: 'ruby:schedule_reminder', // Schedule due date reminder
    afterUpdate: 'java:sync_to_calendar' // Sync to external calendar
  }
};

// Register collections
schema.registerCollection(projectsSchema);
schema.registerCollection(listsSchema);
schema.registerCollection(tasksSchema);

// Initialize services
const userManager = new UserManager(db);
const restAPI = new RestAPI(db, schema);
const realtime = new RealtimeServer(db, schema);

/**
 * Example: Create a project with tasks
 */
async function createProject() {
  console.log('\n--- Creating Project ---');

  // Register user
  const user = await userManager.register({
    email: 'user@todo.com',
    password: 'password123',
    username: 'todouser'
  });

  // Create project
  const projectRequest = {
    method: 'POST',
    path: '/api/collections/projects',
    query: {},
    body: {
      name: 'ElideBase Development',
      description: 'Build the next generation backend-in-a-file',
      color: '#9b59b6',
      owner_id: user.id
    },
    headers: {},
    user
  };

  const projectResponse = await restAPI.handle(projectRequest);
  const project = projectResponse.body;

  console.log('Created project:', project.name);

  // Create lists
  const lists = ['Backlog', 'In Progress', 'Done'];
  const createdLists = [];

  for (let i = 0; i < lists.length; i++) {
    const listRequest = {
      method: 'POST',
      path: '/api/collections/lists',
      query: {},
      body: {
        name: lists[i],
        project_id: project.id,
        position: i
      },
      headers: {},
      user
    };

    const listResponse = await restAPI.handle(listRequest);
    createdLists.push(listResponse.body);
    console.log('Created list:', listResponse.body.name);
  }

  return { user, project, lists: createdLists };
}

/**
 * Example: Create tasks with ML priority prediction
 */
async function createTasks(listId: string, userId: string) {
  console.log('\n--- Creating Tasks ---');

  const tasks = [
    {
      title: 'Implement database layer',
      description: 'Build SQLite wrapper with migrations',
      priority: 'high',
      tags: ['backend', 'database']
    },
    {
      title: 'Add real-time subscriptions',
      description: 'WebSocket-based real-time updates',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['backend', 'realtime']
    },
    {
      title: 'Write documentation',
      description: 'Complete API documentation',
      priority: 'low',
      tags: ['docs']
    }
  ];

  const createdTasks = [];

  for (const taskData of tasks) {
    const taskRequest = {
      method: 'POST',
      path: '/api/collections/tasks',
      query: {},
      body: {
        ...taskData,
        list_id: listId,
        assignee_id: userId
      },
      headers: {}
    };

    const taskResponse = await restAPI.handle(taskRequest);
    createdTasks.push(taskResponse.body);

    console.log('Created task:', taskResponse.body.title);
    console.log('Python Hook will predict priority based on content');
    console.log('Ruby Hook will schedule reminder for due date');
  }

  return createdTasks;
}

/**
 * Example: Real-time collaboration
 */
async function collaborateRealtime(listId: string) {
  console.log('\n--- Real-time Collaboration ---');

  // Simulate two users collaborating
  const user1 = {
    id: 'user-1',
    send: (data: any) => {
      console.log('[User 1] Received:', JSON.parse(data).event?.type);
    },
    close: () => {}
  };

  const user2 = {
    id: 'user-2',
    send: (data: any) => {
      console.log('[User 2] Received:', JSON.parse(data).event?.type);
    },
    close: () => {}
  };

  // Register clients
  realtime.registerClient(user1);
  realtime.registerClient(user2);

  // Subscribe to tasks in this list
  realtime.handleMessage(user1.id, {
    type: 'subscribe',
    collection: 'tasks',
    filter: `list_id=${listId}`
  });

  realtime.handleMessage(user2.id, {
    type: 'subscribe',
    collection: 'tasks',
    filter: `list_id=${listId}`
  });

  // User 1 creates a task
  const newTask = {
    id: 'task-123',
    title: 'Review pull request',
    list_id: listId,
    completed: false
  };

  realtime.broadcast({
    type: 'create',
    collection: 'tasks',
    record: newTask,
    timestamp: Date.now()
  });

  console.log('Task created by User 1, broadcasted to User 2');

  // User 2 completes a task
  const updatedTask = {
    ...newTask,
    completed: true
  };

  realtime.broadcast({
    type: 'update',
    collection: 'tasks',
    record: updatedTask,
    timestamp: Date.now()
  });

  console.log('Task completed by User 2, broadcasted to User 1');
}

/**
 * Example: Get tasks with filtering
 */
async function getTasks() {
  console.log('\n--- Getting Tasks ---');

  // Get all incomplete tasks
  const incompleteRequest = {
    method: 'GET',
    path: '/api/collections/tasks',
    query: {
      filter: 'completed=false',
      sort: 'priority',
      expand: 'assignee_id,list_id'
    },
    headers: {}
  };

  const incompleteResponse = await restAPI.handle(incompleteRequest);
  console.log('Incomplete tasks:', incompleteResponse.body.totalItems);

  // Get high priority tasks
  const highPriorityRequest = {
    method: 'GET',
    path: '/api/collections/tasks',
    query: {
      filter: 'priority=high&&completed=false',
      sort: 'due_date'
    },
    headers: {}
  };

  const highPriorityResponse = await restAPI.handle(highPriorityRequest);
  console.log('High priority tasks:', highPriorityResponse.body.totalItems);

  // Get overdue tasks
  const now = new Date().toISOString();
  const overdueRequest = {
    method: 'GET',
    path: '/api/collections/tasks',
    query: {
      filter: `due_date<${now}&&completed=false`
    },
    headers: {}
  };

  const overdueResponse = await restAPI.handle(overdueRequest);
  console.log('Overdue tasks:', overdueResponse.body.totalItems);
}

/**
 * Example: Complete a task
 */
async function completeTask(taskId: string) {
  console.log('\n--- Completing Task ---');

  const request = {
    method: 'PATCH',
    path: `/api/collections/tasks/${taskId}`,
    query: {},
    body: {
      completed: true,
      completed_at: new Date().toISOString()
    },
    headers: {}
  };

  const response = await restAPI.handle(request);
  console.log('Task completed:', response.body.title);
  console.log('Java Hook will sync to external calendar');

  return response.body;
}

/**
 * Run the todo app example
 */
async function main() {
  console.log('=== ElideBase Todo App Example ===');

  // Create project and lists
  const { user, project, lists } = await createProject();

  // Create tasks
  const tasks = await createTasks(lists[0].id, user.id);

  // Real-time collaboration
  await collaborateRealtime(lists[0].id);

  // Get tasks with filtering
  await getTasks();

  // Complete a task
  await completeTask(tasks[0].id);

  console.log('\n=== Todo App Example Complete ===');
  console.log('\nFeatures demonstrated:');
  console.log('- Project and task management');
  console.log('- Real-time collaboration');
  console.log('- Python ML hooks for priority prediction');
  console.log('- Ruby hooks for due date reminders');
  console.log('- Java hooks for calendar sync');
  console.log('- Advanced filtering and sorting');
  console.log('- Relations and expand');
}

// Run example
main().catch(console.error);
