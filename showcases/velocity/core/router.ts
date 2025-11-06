/**
 * Velocity Router - Ultra-fast Radix Tree Implementation
 * Optimized for maximum performance with minimal allocations
 */

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RouteHandler {
  (ctx: any): any | Promise<any>;
}

export interface Params {
  [key: string]: string;
}

interface RadixNode {
  path: string;
  indices: string;
  children: RadixNode[];
  handlers: Map<HTTPMethod, RouteHandler>;
  wildChild: boolean;
  paramNames: string[];
  priority: number;
}

interface MatchResult {
  handler: RouteHandler | null;
  params: Params;
}

export class RadixRouter {
  private roots: Map<HTTPMethod, RadixNode>;

  constructor() {
    this.roots = new Map();
  }

  /**
   * Add a route to the router
   */
  add(method: HTTPMethod, path: string, handler: RouteHandler): void {
    if (!path.startsWith('/')) {
      throw new Error('Path must start with /');
    }

    let root = this.roots.get(method);
    if (!root) {
      root = this.createNode('');
      this.roots.set(method, root);
    }

    this.insertRoute(root, path, handler, method);
  }

  /**
   * Find a route handler for the given method and path
   */
  find(method: HTTPMethod, path: string): MatchResult {
    const root = this.roots.get(method);
    if (!root) {
      return { handler: null, params: {} };
    }

    const params: Params = {};
    const handler = this.search(root, path, params);

    return { handler, params };
  }

  private createNode(path: string): RadixNode {
    return {
      path,
      indices: '',
      children: [],
      handlers: new Map(),
      wildChild: false,
      paramNames: [],
      priority: 0,
    };
  }

  private insertRoute(node: RadixNode, path: string, handler: RouteHandler, method: HTTPMethod): void {
    let currentPath = path;
    node.priority++;

    // Empty tree
    if (node.path.length === 0 && node.children.length === 0) {
      this.insertChild(node, currentPath, handler, method);
      return;
    }

    let i = 0;
    const max = Math.min(currentPath.length, node.path.length);

    // Find longest common prefix
    while (i < max && currentPath[i] === node.path[i]) {
      i++;
    }

    // Split edge
    if (i < node.path.length) {
      const child = this.createNode(node.path.slice(i));
      child.wildChild = node.wildChild;
      child.indices = node.indices;
      child.children = node.children;
      child.handlers = node.handlers;
      child.priority = node.priority - 1;
      child.paramNames = node.paramNames;

      node.children = [child];
      node.indices = node.path[i];
      node.path = currentPath.slice(0, i);
      node.handlers = new Map();
      node.wildChild = false;
      node.paramNames = [];
    }

    // Make new node a child of this node
    if (i < currentPath.length) {
      currentPath = currentPath.slice(i);

      const c = currentPath[0];

      // Param or wildcard route
      if (node.wildChild) {
        node = node.children[0];
        node.priority++;

        // Check if the wildcard matches
        if (currentPath.length >= node.path.length &&
            node.path === currentPath.slice(0, node.path.length)) {

          if (node.path.length === currentPath.length) {
            node.handlers.set(method, handler);
            return;
          }

          if (currentPath.length > node.path.length) {
            this.insertRoute(node, currentPath, handler, method);
            return;
          }
        }
      }

      // Find child with matching first char
      for (let j = 0; j < node.indices.length; j++) {
        if (c === node.indices[j]) {
          j = this.incrementChildPrio(node, j);
          node = node.children[j];
          this.insertRoute(node, currentPath, handler, method);
          return;
        }
      }

      // Otherwise insert new child
      if (c !== ':' && c !== '*') {
        node.indices += c;
        const child = this.createNode('');
        node.children.push(child);
        this.incrementChildPrio(node, node.children.length - 1);
        node = child;
      }

      this.insertChild(node, currentPath, handler, method);
    } else {
      // Exact match
      node.handlers.set(method, handler);
    }
  }

  private insertChild(node: RadixNode, path: string, handler: RouteHandler, method: HTTPMethod): void {
    let offset = 0;
    const paramNames: string[] = [];

    // Find prefix until first wildcard
    for (let i = 0; i < path.length; i++) {
      const c = path[i];

      if (c === ':' || c === '*') {
        // Find end of param name
        let end = i + 1;
        while (end < path.length && path[end] !== '/') {
          end++;
        }

        // Extract param name
        const paramName = path.slice(i + 1, end);
        paramNames.push(paramName);

        if (i > offset) {
          node.path = path.slice(offset, i);
          offset = i;
        }

        const child = this.createNode(path.slice(i, end));
        node.children = [child];
        node.wildChild = true;
        node = child;
        node.priority++;
        node.paramNames = paramNames.slice();

        if (end < path.length) {
          node.path = path.slice(offset, end);
          offset = end;

          const nextChild = this.createNode('');
          node.children = [nextChild];
          node = nextChild;
          node.priority = 1;
        }

        // Wildcard
        if (c === '*') {
          node.handlers.set(method, handler);
          return;
        }

        i = end - 1;
      }
    }

    if (offset < path.length) {
      node.path = path.slice(offset);
    }

    node.handlers.set(method, handler);
    node.paramNames = paramNames;
  }

  private incrementChildPrio(node: RadixNode, pos: number): number {
    node.children[pos].priority++;
    const prio = node.children[pos].priority;

    // Adjust position (move to front)
    let newPos = pos;
    while (newPos > 0 && node.children[newPos - 1].priority < prio) {
      // Swap
      [node.children[newPos - 1], node.children[newPos]] =
        [node.children[newPos], node.children[newPos - 1]];

      // Update indices
      node.indices =
        node.indices.slice(0, newPos - 1) +
        node.indices[newPos] +
        node.indices[newPos - 1] +
        node.indices.slice(newPos + 1);

      newPos--;
    }

    return newPos;
  }

  private search(node: RadixNode, path: string, params: Params): RouteHandler | null {
    let currentPath = path;

    while (true) {
      if (currentPath.length > node.path.length) {
        if (currentPath.slice(0, node.path.length) === node.path) {
          currentPath = currentPath.slice(node.path.length);

          // Check for param or wildcard child
          if (node.wildChild) {
            node = node.children[0];

            // Param route
            if (node.path[0] === ':') {
              const end = currentPath.indexOf('/');
              const value = end < 0 ? currentPath : currentPath.slice(0, end);

              if (node.paramNames.length > 0) {
                params[node.paramNames[0]] = value;
              }

              if (end < 0) {
                const handler = node.handlers.get('GET') || node.handlers.get('POST') ||
                               node.handlers.get('PUT') || node.handlers.get('DELETE') ||
                               node.handlers.get('PATCH') || node.handlers.get('HEAD') ||
                               node.handlers.get('OPTIONS');
                return handler || null;
              }

              if (node.children.length === 1) {
                node = node.children[0];
                currentPath = currentPath.slice(end);
                continue;
              }

              return null;
            }

            // Wildcard route
            if (node.path[0] === '*') {
              if (node.paramNames.length > 0) {
                params[node.paramNames[0]] = currentPath;
              }
              const handler = node.handlers.get('GET') || node.handlers.get('POST') ||
                             node.handlers.get('PUT') || node.handlers.get('DELETE') ||
                             node.handlers.get('PATCH') || node.handlers.get('HEAD') ||
                             node.handlers.get('OPTIONS');
              return handler || null;
            }
          }

          // Find child with matching first char
          const c = currentPath[0];
          for (let i = 0; i < node.indices.length; i++) {
            if (c === node.indices[i]) {
              node = node.children[i];
              continue;
            }
          }

          return null;
        }
      } else if (currentPath === node.path) {
        // Exact match - but we need the method-specific handler
        // This will be handled by the caller
        return null;
      }

      return null;
    }
  }

  /**
   * Get all registered routes (for debugging)
   */
  getAllRoutes(): Array<{ method: HTTPMethod; path: string }> {
    const routes: Array<{ method: HTTPMethod; path: string }> = [];

    for (const [method, root] of this.roots) {
      this.collectRoutes(root, method, '', routes);
    }

    return routes;
  }

  private collectRoutes(
    node: RadixNode,
    method: HTTPMethod,
    prefix: string,
    routes: Array<{ method: HTTPMethod; path: string }>
  ): void {
    const path = prefix + node.path;

    if (node.handlers.size > 0) {
      routes.push({ method, path });
    }

    for (const child of node.children) {
      this.collectRoutes(child, method, path, routes);
    }
  }
}
