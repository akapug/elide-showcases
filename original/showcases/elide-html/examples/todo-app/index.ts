/**
 * ElideHTML - Todo App Example
 *
 * Complete todo application using htmx and ElideHTML.
 * Demonstrates forms, validation, CRUD operations, and live updates.
 */

import { html, render } from '../../runtime/renderer.ts';
import { Layout, UI, Form, Htmx } from '../../runtime/components.ts';
import { hx, htmx } from '../../helpers/htmx-helpers.ts';
import { form, rules } from '../../helpers/forms.ts';
import { csrf } from '../../helpers/forms.ts';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

/**
 * In-memory todo storage (replace with database in production)
 */
export class TodoStore {
  private todos: Map<string, Todo> = new Map();
  private nextId = 1;

  create(title: string, description: string): Todo {
    const todo: Todo = {
      id: String(this.nextId++),
      title,
      description,
      completed: false,
      createdAt: new Date(),
    };

    this.todos.set(todo.id, todo);
    return todo;
  }

  getAll(): Todo[] {
    return Array.from(this.todos.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  update(id: string, updates: Partial<Todo>): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) return undefined;

    Object.assign(todo, updates);
    return todo;
  }

  delete(id: string): boolean {
    return this.todos.delete(id);
  }

  toggleComplete(id: string): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) return undefined;

    todo.completed = !todo.completed;
    return todo;
  }

  getStats(): { total: number; completed: number; active: number } {
    const todos = this.getAll();
    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
    };
  }
}

export const todoStore = new TodoStore();

/**
 * Render a single todo item
 */
export function TodoItem(todo: Todo): string {
  return render(
    html.div(
      {
        id: `todo-${todo.id}`,
        class: 'todo-item',
      },
      html.div(
        { class: 'todo-content' },
        html.input({
          type: 'checkbox',
          checked: todo.completed,
          ...hx().post(`/todos/${todo.id}/toggle`).swap('outerHTML').build(),
          ...hx().target(`#todo-${todo.id}`).build(),
        }),
        html.div(
          { class: todo.completed ? 'todo-text completed' : 'todo-text' },
          html.h4(null, todo.title),
          html.p(null, todo.description)
        )
      ),
      html.div(
        { class: 'todo-actions' },
        html.button(
          {
            ...hx().get(`/todos/${todo.id}/edit`).swap('outerHTML').build(),
            ...hx().target(`#todo-${todo.id}`).build(),
            class: 'btn btn-sm',
          },
          'Edit'
        ),
        html.button(
          {
            ...htmx.deleteWithConfirm(`/todos/${todo.id}`, 'Delete this todo?'),
            ...hx().target(`#todo-${todo.id}`).build(),
            class: 'btn btn-sm btn-danger',
          },
          'Delete'
        )
      )
    )
  );
}

/**
 * Render todo list
 */
export function TodoList(todos: Todo[]): string {
  return render(
    html.div(
      { id: 'todo-list' },
      todos.length === 0
        ? html.div({ class: 'empty-state' }, 'No todos yet. Add one above!')
        : null,
      ...todos.map((todo) => html.html({ tag: 'div' }, TodoItem(todo)) as any)
    )
  );
}

/**
 * Render add todo form
 */
export function AddTodoForm(csrfToken: string): string {
  const todoForm = form('/todos', 'post')
    .csrf(csrfToken)
    .htmx('#todo-list', 'beforebegin')
    .text('title', 'Title', {
      placeholder: 'What needs to be done?',
      required: true,
      rules: [rules.required(), rules.min(3), rules.max(100)],
    })
    .textarea('description', 'Description', {
      placeholder: 'Add more details...',
      rules: [rules.max(500)],
    });

  return render(
    html.div(
      { class: 'add-todo-form' },
      html.h3(null, 'Add Todo'),
      todoForm.render()
    )
  );
}

/**
 * Render edit todo form
 */
export function EditTodoForm(todo: Todo, csrfToken: string): string {
  return render(
    html.div(
      {
        id: `todo-${todo.id}`,
        class: 'todo-item editing',
      },
      html.form(
        {
          ...hx().put(`/todos/${todo.id}`).swap('outerHTML').build(),
          ...hx().target(`#todo-${todo.id}`).build(),
        },
        html.input({ type: 'hidden', name: '_csrf', value: csrfToken }),
        html.div(
          { class: 'form-group' },
          html.input({
            type: 'text',
            name: 'title',
            value: todo.title,
            class: 'form-control',
            required: true,
          })
        ),
        html.div(
          { class: 'form-group' },
          html.textarea(
            {
              name: 'description',
              class: 'form-control',
              rows: 3,
            },
            todo.description
          )
        ),
        html.div(
          { class: 'form-actions' },
          html.button({ type: 'submit', class: 'btn btn-primary' }, 'Save'),
          html.button(
            {
              type: 'button',
              ...hx().get(`/todos/${todo.id}`).swap('outerHTML').build(),
              ...hx().target(`#todo-${todo.id}`).build(),
              class: 'btn',
            },
            'Cancel'
          )
        )
      )
    )
  );
}

/**
 * Render stats
 */
export function TodoStats(stats: { total: number; completed: number; active: number }): string {
  return render(
    html.div(
      {
        id: 'todo-stats',
        class: 'todo-stats',
      },
      UI.Badge({ variant: 'primary' }, [`Total: ${stats.total}`]),
      UI.Badge({ variant: 'success' }, [`Completed: ${stats.completed}`]),
      UI.Badge({ variant: 'secondary' }, [`Active: ${stats.active}`])
    )
  );
}

/**
 * Render complete todo app page
 */
export function TodoApp(csrfToken: string): string {
  const todos = todoStore.getAll();
  const stats = todoStore.getStats();

  return render(
    Layout.Document({
      title: 'ElideHTML Todo App',
      htmx: true,
      head: [
        html.style(
          null,
          `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 2rem; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; margin-bottom: 2rem; }
            .todo-stats { display: flex; gap: 1rem; margin-bottom: 2rem; }
            .badge { padding: 0.5rem 1rem; border-radius: 4px; font-weight: 500; }
            .badge-primary { background: #007bff; color: white; }
            .badge-success { background: #28a745; color: white; }
            .badge-secondary { background: #6c757d; color: white; }
            .add-todo-form { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .add-todo-form h3 { margin-bottom: 1rem; color: #333; }
            .form-group { margin-bottom: 1rem; }
            .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
            .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
            .form-control:focus { outline: none; border-color: #007bff; }
            .form-control.is-invalid { border-color: #dc3545; }
            .invalid-feedback { color: #dc3545; font-size: 0.875rem; margin-top: 0.25rem; }
            .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
            .btn-primary { background: #007bff; color: white; }
            .btn-primary:hover { background: #0056b3; }
            .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
            .btn-danger { background: #dc3545; color: white; }
            .btn-danger:hover { background: #c82333; }
            .todo-item { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
            .todo-content { display: flex; gap: 1rem; align-items: start; flex: 1; }
            .todo-text h4 { color: #333; margin-bottom: 0.25rem; }
            .todo-text p { color: #666; font-size: 0.875rem; }
            .todo-text.completed h4 { text-decoration: line-through; color: #999; }
            .todo-text.completed p { color: #999; }
            .todo-actions { display: flex; gap: 0.5rem; }
            .empty-state { text-align: center; padding: 3rem; color: #999; }
            .form-actions { display: flex; gap: 0.5rem; }
          `
        ),
      ],
      children: [
        html.div(
          { class: 'container' },
          html.h1(null, 'Todo App'),
          TodoStats(stats) as any,
          AddTodoForm(csrfToken) as any,
          TodoList(todos) as any
        ),
      ],
    })
  );
}

/**
 * HTTP Handlers for the todo app
 */
export const handlers = {
  // GET / - Show todo app
  index: () => {
    const token = csrf.generate('session-1');
    return new Response(TodoApp(token), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // POST /todos - Create todo
  create: async (request: Request) => {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    const todo = todoStore.create(title, description);

    return new Response(TodoItem(todo), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // GET /todos/:id - Get single todo
  get: (id: string) => {
    const todo = todoStore.getById(id);
    if (!todo) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(TodoItem(todo), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // GET /todos/:id/edit - Get edit form
  edit: (id: string) => {
    const todo = todoStore.getById(id);
    if (!todo) {
      return new Response('Not found', { status: 404 });
    }

    const token = csrf.generate('session-1');
    return new Response(EditTodoForm(todo, token), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // PUT /todos/:id - Update todo
  update: async (id: string, request: Request) => {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    const todo = todoStore.update(id, { title, description });

    if (!todo) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(TodoItem(todo), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // POST /todos/:id/toggle - Toggle completion
  toggle: (id: string) => {
    const todo = todoStore.toggleComplete(id);

    if (!todo) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(TodoItem(todo), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // DELETE /todos/:id - Delete todo
  delete: (id: string) => {
    const success = todoStore.delete(id);

    if (!success) {
      return new Response('Not found', { status: 404 });
    }

    return new Response('', {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};
