/**
 * REST API Example - TypeScript
 *
 * Full-featured API endpoint with CRUD operations.
 */

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// In-memory storage (in production, use KV store)
const todos: Map<string, Todo> = new Map();

export async function handler(event: any, context: any): Promise<any> {
  const { method, path, body } = event;

  console.log(`${method} ${path}`);

  try {
    switch (method) {
      case 'GET':
        return handleGet(event);
      case 'POST':
        return handlePost(event);
      case 'PUT':
        return handlePut(event);
      case 'DELETE':
        return handleDelete(event);
      default:
        return {
          statusCode: 405,
          error: 'Method Not Allowed',
        };
    }
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      error: error.message,
    };
  }
}

function handleGet(event: any): any {
  const id = event.params?.id;

  if (id) {
    // Get single todo
    const todo = todos.get(id);
    if (!todo) {
      return {
        statusCode: 404,
        error: 'Todo not found',
      };
    }
    return {
      statusCode: 200,
      data: todo,
    };
  }

  // Get all todos
  return {
    statusCode: 200,
    data: Array.from(todos.values()),
    count: todos.size,
  };
}

function handlePost(event: any): any {
  const { title } = event.body || {};

  if (!title) {
    return {
      statusCode: 400,
      error: 'Title is required',
    };
  }

  const id = `todo-${Date.now()}`;
  const todo: Todo = {
    id,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.set(id, todo);

  return {
    statusCode: 201,
    data: todo,
  };
}

function handlePut(event: any): any {
  const id = event.params?.id;

  if (!id) {
    return {
      statusCode: 400,
      error: 'ID is required',
    };
  }

  const todo = todos.get(id);
  if (!todo) {
    return {
      statusCode: 404,
      error: 'Todo not found',
    };
  }

  const { title, completed } = event.body || {};

  if (title !== undefined) todo.title = title;
  if (completed !== undefined) todo.completed = completed;

  return {
    statusCode: 200,
    data: todo,
  };
}

function handleDelete(event: any): any {
  const id = event.params?.id;

  if (!id) {
    return {
      statusCode: 400,
      error: 'ID is required',
    };
  }

  if (!todos.has(id)) {
    return {
      statusCode: 404,
      error: 'Todo not found',
    };
  }

  todos.delete(id);

  return {
    statusCode: 204,
  };
}

export default handler;
