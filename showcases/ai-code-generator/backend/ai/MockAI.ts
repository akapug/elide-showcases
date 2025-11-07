/**
 * Mock AI Client
 *
 * Simulates AI code generation for testing and demo purposes
 * Used when no API key is provided
 */

import { logger } from '../utils/logger';

interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export class MockAI {
  /**
   * Generate code (mock implementation)
   */
  async generate(options: GenerateOptions): Promise<string> {
    logger.info('Using Mock AI for code generation');

    // Simulate API delay
    await this.delay(500 + Math.random() * 1000);

    // Parse user prompt to determine what to generate
    const prompt = options.userPrompt.toLowerCase();

    if (prompt.includes('todo') || prompt.includes('task')) {
      return this.generateTodoApp(prompt);
    } else if (prompt.includes('button') || prompt.includes('component')) {
      return this.generateButton(prompt);
    } else if (prompt.includes('api') || prompt.includes('server')) {
      return this.generateAPI(prompt);
    } else if (prompt.includes('landing') || prompt.includes('page') || prompt.includes('website')) {
      return this.generateLandingPage(prompt);
    } else if (prompt.includes('python')) {
      return this.generatePython(prompt);
    } else if (prompt.includes('ruby')) {
      return this.generateRuby(prompt);
    } else if (prompt.includes('java')) {
      return this.generateJava(prompt);
    } else {
      return this.generateGeneric(prompt);
    }
  }

  /**
   * Generate Todo App
   */
  private generateTodoApp(prompt: string): string {
    const hasTypeScript = prompt.includes('typescript') || prompt.includes('ts');
    const ext = hasTypeScript ? 'tsx' : 'jsx';

    return `I'll create a Todo application with add, complete, and delete functionality.

\`\`\`${ext} // App.${ext}
import React, { useState } from 'react';
import './styles.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: input,
        completed: false
      }]);
      setInput('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-app">
      <h1>Todo List</h1>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
\`\`\`

\`\`\`css // styles.css
.todo-app {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  text-align: center;
}

.input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input[type="text"] {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background: #0056b3;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.todo-list li.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-list li button {
  margin-left: auto;
  background: #dc3545;
  padding: 5px 10px;
  font-size: 14px;
}

.todo-list li button:hover {
  background: #c82333;
}
\`\`\`

Dependencies:
- react: ^18.2.0
- react-dom: ^18.2.0
${hasTypeScript ? '- typescript: ^5.0.0\n- @types/react: ^18.0.0' : ''}

Suggestions:
- Add local storage persistence
- Add filter options (all, active, completed)
- Add edit functionality
- Add due dates
- Add priority levels`;
  }

  /**
   * Generate Button Component
   */
  private generateButton(prompt: string): string {
    return `I'll create a reusable button component with ripple effect.

\`\`\`tsx // Button.tsx
import React, { useState, MouseEvent } from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
      <span className="ripple-container">
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y
            }}
          />
        ))}
      </span>
    </button>
  );
};
\`\`\`

\`\`\`css // Button.css
.btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
}

.btn-medium {
  padding: 10px 20px;
  font-size: 16px;
}

.btn-large {
  padding: 14px 28px;
  font-size: 18px;
}

.ripple-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  animation: ripple-animation 0.6s ease-out;
}

@keyframes ripple-animation {
  from {
    width: 0;
    height: 0;
    opacity: 1;
  }
  to {
    width: 100px;
    height: 100px;
    opacity: 0;
  }
}
\`\`\`

Dependencies:
- react: ^18.2.0
- typescript: ^5.0.0

Suggestions:
- Add loading state with spinner
- Add icon support
- Add button group component
- Add tooltip on hover`;
  }

  /**
   * Generate API
   */
  private generateAPI(prompt: string): string {
    const isPython = prompt.includes('python');
    const isRuby = prompt.includes('ruby');

    if (isPython) {
      return this.generatePythonAPI();
    } else if (isRuby) {
      return this.generateRubyAPI();
    } else {
      return this.generateNodeAPI();
    }
  }

  /**
   * Generate Node.js API
   */
  private generateNodeAPI(): string {
    return `I'll create a RESTful API server with user management.

\`\`\`typescript // server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

const users: User[] = [];

// Get all users
app.get('/api/users', (req: Request, res: Response) => {
  res.json(users);
});

// Get user by ID
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Create user
app.post('/api/users', (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email required' });
  }

  const user: User = {
    id: users.length + 1,
    name,
    email,
    createdAt: new Date()
  };

  users.push(user);
  res.status(201).json(user);
});

// Update user
app.put('/api/users/:id', (req: Request, res: Response) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
});

// Delete user
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
\`\`\`

Dependencies:
- express: ^4.18.0
- cors: ^2.8.5
- typescript: ^5.0.0
- @types/express: ^4.17.0
- @types/cors: ^2.8.0

Suggestions:
- Add database integration (PostgreSQL, MongoDB)
- Add authentication with JWT
- Add input validation with Joi or Zod
- Add API documentation with Swagger
- Add rate limiting`;
  }

  private generatePythonAPI(): string {
    return this.generatePython('Create a Python API');
  }

  private generateRubyAPI(): string {
    return this.generateRuby('Create a Ruby API');
  }

  /**
   * Generate Landing Page
   */
  private generateLandingPage(prompt: string): string {
    return `I'll create a modern landing page with hero section and features.

\`\`\`html // index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Landing Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav class="navbar">
      <div class="container">
        <div class="logo">YourBrand</div>
        <ul class="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <button class="cta-button">Get Started</button>
      </div>
    </nav>
  </header>

  <section class="hero">
    <div class="container">
      <h1 class="hero-title">Build Something Amazing</h1>
      <p class="hero-subtitle">
        Transform your ideas into reality with our powerful platform
      </p>
      <button class="cta-button large">Start Free Trial</button>
    </div>
  </section>

  <section id="features" class="features">
    <div class="container">
      <h2>Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Lightning Fast</h3>
          <p>Optimized for speed and performance</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Secure</h3>
          <p>Enterprise-grade security built-in</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌍</div>
          <h3>Global Scale</h3>
          <p>Deploy worldwide instantly</p>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; 2025 YourBrand. All rights reserved.</p>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
\`\`\`

\`\`\`css // styles.css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #333;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #007bff;
}

.cta-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.cta-button:hover {
  background: #0056b3;
}

.cta-button.large {
  padding: 1rem 2rem;
  font-size: 1.2rem;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8rem 0;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: fadeInUp 0.6s ease-out;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.features {
  padding: 5rem 0;
  background: #f8f9fa;
}

.features h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 2rem 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
\`\`\`

\`\`\`javascript // script.js
// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add scroll animation
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.6s, transform 0.6s';
  observer.observe(card);
});
\`\`\`

Suggestions:
- Add contact form
- Add testimonials section
- Add pricing table
- Make fully responsive
- Add animations on scroll`;
  }

  /**
   * Generate Python code
   */
  private generatePython(prompt: string): string {
    return `I'll create a Python application with proper structure and error handling.

\`\`\`python // main.py
#!/usr/bin/env python3
"""
Main application module
"""

from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Application:
    """Main application class"""

    def __init__(self):
        self.data: List[Dict] = []
        logger.info("Application initialized")

    def add_item(self, item: Dict) -> None:
        """Add an item to the collection"""
        if not item:
            raise ValueError("Item cannot be empty")
        self.data.append(item)
        logger.info(f"Added item: {item}")

    def get_items(self) -> List[Dict]:
        """Get all items"""
        return self.data

    def find_item(self, key: str, value: any) -> Optional[Dict]:
        """Find an item by key-value pair"""
        for item in self.data:
            if item.get(key) == value:
                return item
        return None

    def remove_item(self, key: str, value: any) -> bool:
        """Remove an item by key-value pair"""
        item = self.find_item(key, value)
        if item:
            self.data.remove(item)
            logger.info(f"Removed item: {item}")
            return True
        return False


def main():
    """Main entry point"""
    app = Application()

    # Example usage
    app.add_item({"id": 1, "name": "Item 1"})
    app.add_item({"id": 2, "name": "Item 2"})

    items = app.get_items()
    print(f"Total items: {len(items)}")

    found = app.find_item("id", 1)
    if found:
        print(f"Found: {found}")

    app.remove_item("id", 2)


if __name__ == "__main__":
    main()
\`\`\`

Dependencies:
- python: >=3.8

Suggestions:
- Add database integration (SQLAlchemy)
- Add REST API with FastAPI or Flask
- Add unit tests with pytest
- Add data validation with Pydantic
- Add CLI with Click or argparse`;
  }

  /**
   * Generate Ruby code
   */
  private generateRuby(prompt: string): string {
    return `I'll create a Ruby application following best practices.

\`\`\`ruby // main.rb
# frozen_string_literal: true

require 'logger'

# Main application class
class Application
  attr_reader :data, :logger

  def initialize
    @data = []
    @logger = Logger.new($stdout)
    @logger.info('Application initialized')
  end

  # Add an item to the collection
  def add_item(item)
    raise ArgumentError, 'Item cannot be nil or empty' if item.nil? || item.empty?

    @data << item
    @logger.info("Added item: #{item}")
  end

  # Get all items
  def items
    @data.dup
  end

  # Find an item by key-value pair
  def find_item(key, value)
    @data.find { |item| item[key] == value }
  end

  # Remove an item by key-value pair
  def remove_item(key, value)
    item = find_item(key, value)
    return false unless item

    @data.delete(item)
    @logger.info("Removed item: #{item}")
    true
  end
end

# Main entry point
def main
  app = Application.new

  # Example usage
  app.add_item({ id: 1, name: 'Item 1' })
  app.add_item({ id: 2, name: 'Item 2' })

  puts "Total items: #{app.items.length}"

  found = app.find_item(:id, 1)
  puts "Found: #{found}" if found

  app.remove_item(:id, 2)
end

main if __FILE__ == $PROGRAM_NAME
\`\`\`

Dependencies:
- ruby: >=2.7.0

Suggestions:
- Add Sinatra for web API
- Add ActiveRecord for database
- Add RSpec for testing
- Add Rubocop for linting
- Add dry-validation for input validation`;
  }

  /**
   * Generate Java code
   */
  private generateJava(prompt: string): string {
    return `I'll create a Java application with proper OOP structure.

\`\`\`java // Main.java
import java.util.*;
import java.util.logging.*;

/**
 * Main application class
 */
public class Main {
    private static final Logger LOGGER = Logger.getLogger(Main.class.getName());

    public static void main(String[] args) {
        Application app = new Application();

        // Example usage
        app.addItem(Map.of("id", 1, "name", "Item 1"));
        app.addItem(Map.of("id", 2, "name", "Item 2"));

        System.out.println("Total items: " + app.getItems().size());

        Optional<Map<String, Object>> found = app.findItem("id", 1);
        found.ifPresent(item -> System.out.println("Found: " + item));

        app.removeItem("id", 2);
    }
}

/**
 * Application class managing items
 */
class Application {
    private final List<Map<String, Object>> data;
    private static final Logger LOGGER = Logger.getLogger(Application.class.getName());

    public Application() {
        this.data = new ArrayList<>();
        LOGGER.info("Application initialized");
    }

    /**
     * Add an item to the collection
     */
    public void addItem(Map<String, Object> item) {
        if (item == null || item.isEmpty()) {
            throw new IllegalArgumentException("Item cannot be null or empty");
        }
        data.add(item);
        LOGGER.info("Added item: " + item);
    }

    /**
     * Get all items
     */
    public List<Map<String, Object>> getItems() {
        return new ArrayList<>(data);
    }

    /**
     * Find an item by key-value pair
     */
    public Optional<Map<String, Object>> findItem(String key, Object value) {
        return data.stream()
            .filter(item -> Objects.equals(item.get(key), value))
            .findFirst();
    }

    /**
     * Remove an item by key-value pair
     */
    public boolean removeItem(String key, Object value) {
        Optional<Map<String, Object>> item = findItem(key, value);
        if (item.isPresent()) {
            data.remove(item.get());
            LOGGER.info("Removed item: " + item.get());
            return true;
        }
        return false;
    }
}
\`\`\`

Dependencies:
- java: >=11

Suggestions:
- Add Spring Boot for web framework
- Add JPA/Hibernate for database
- Add JUnit 5 for testing
- Add Lombok to reduce boilerplate
- Add validation with Bean Validation`;
  }

  /**
   * Generate generic code
   */
  private generateGeneric(prompt: string): string {
    return `I'll create a basic application structure.

\`\`\`typescript // index.ts
/**
 * Main application
 */

interface Config {
  debug: boolean;
  version: string;
}

class Application {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.init();
  }

  private init(): void {
    console.log(\`Application v\${this.config.version} initialized\`);
    if (this.config.debug) {
      console.log('Debug mode enabled');
    }
  }

  public run(): void {
    console.log('Application running...');
    // Your code here
  }
}

// Create and run application
const app = new Application({
  debug: true,
  version: '1.0.0'
});

app.run();
\`\`\`

Suggestions:
- Add specific functionality based on requirements
- Add error handling
- Add logging
- Add configuration management
- Add tests`;
  }

  /**
   * Simulate delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
